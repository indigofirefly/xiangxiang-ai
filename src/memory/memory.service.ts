import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { ChatOllama } from '@langchain/ollama';
import {HumanMessage, SystemMessage, AIMessage, BaseMessage} from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { config } from '../config.js';
@Injectable()
export class MemoryService {

    // 创建 ChatOllama 实例
    // 所有参数从 config 读取，方便统一管理
    private llm = new ChatOllama({
        model: config.ollama.chatModel,
        baseUrl: config.ollama.baseUrl,
        temperature: config.ollama.temperature,
        think: false,
    });

    private  memorySession = new Map<string, BaseMessage[]>();

    private systemMessage = new SystemMessage('你是一个助手，能记住对话历史，并根据对话历史回答问题');

    private getOrCreateSession(sessionId: string) {
        if (!this.memorySession.has(sessionId)) {
            this.memorySession.set(sessionId, [this.systemMessage]);
        }
        return this.memorySession.get(sessionId)!;
    }

    async chat(sessionId: string, message: string) {
        const history = this.getOrCreateSession(sessionId);
        history.push(new HumanMessage(message));
        const response = await this.llm.invoke(history);
        history.push(response);
        return {
            sessionId,
            message,
            replay: response.content,
            turns: Math.floor((history.length - 1) / 2),
        }
    }

    async chatStream(sessionId: string, message: string, res: Response) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.write(`data: ${JSON.stringify({ sessionId })}\n\n`);

        const history = this.getOrCreateSession(sessionId);
        history.push(new HumanMessage(message));
        
        let fullReplay = '';

        const stream = await this.llm.stream(history);
        for await (const chunk of stream) {
            const content = chunk.content;
            if (content) {
                fullReplay += content;
                res.write(`data: ${JSON.stringify({ message: content })}\n\n`);
            }
        }
        history.push(new AIMessage(fullReplay));
        const turns = Math.floor((history.length - 1) / 2);
        res.write(`data: ${JSON.stringify({ text: '[DONE]', sessionId, turns })}\n\n`);
        res.end();
    }

    getHistory(sessionId: string) {
        const history = this.getOrCreateSession(sessionId);
        if (!history.length) {
            return {sessionId, exait: false, history: []};
        }
        const messages = history.filter(message => !(message instanceof SystemMessage)).map((m, i) => ({
            index: i,
            role: m.type,
            content: m.content,
        }));
        return {sessionId, exists: true, turns: Math.floor((history.length  - 1) / 2), messages};
    }

    clearSession() {
        this.memorySession.clear();
        return { cleared: true};
        
    }

    listSessions() {
        console.log(this.memorySession);
        const sessions = Array.from(this.memorySession.entries()).map(([sessionId, history]) => ({
            sessionId,
            turns: Math.floor((history.length - 1) / 2),
        }));
        return {total: sessions.length, sessions};
    }

    deleteSession(sessionId: string) {
        if (this.memorySession.has(sessionId)) {
            this.memorySession.delete(sessionId);
            return {sessionId, deleted: true}
        }
        
        return {sessionId, deleted: false};
    }
}
