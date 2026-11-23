import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { ChatOllama } from '@langchain/ollama';
import {HumanMessage, SystemMessage} from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { config } from '../config.js';


@Injectable()
export class ModelsService {
    // 创建 ChatOllama 实例
    // 所有参数从 config 读取，方便统一管理
    private llm = new ChatOllama({
        model: config.ollama.chatModel,
        baseUrl: config.ollama.baseUrl,
        temperature: config.ollama.temperature,
        think: false,
    });
    // 1：基础调用
    // 适合：简单问答、不需要流式输出的场景
    async baseChat(message: string) {
        // invoke 接收消息数组，返回 AIMessage 对象
        // HumanMessage 对应角色 role: "user"
        const response = await this.llm.invoke([new HumanMessage(message)]);
        return {
            question: message,
            answer: response.content,
            usage: response.usage_metadata,
        }
    }
    // 2：System Prompt 带 System Prompt 的调用
    // System Prompt 用于设定模型的角色和行为规范
    async chatWithSystem(system: string, message: string) {
         // SystemMessage 最先传入，设定角色
         // HumanMessage 是用户的实际问题
        const response = await this.llm.invoke([new SystemMessage(system), new HumanMessage(message)]);
        return {
            system,
            question: message,
            answer: response.content,
            usage: response.usage_metadata,
        }
    }

    // 3：SSE 流式输出 
    // 适合：需要逐字显示的对话场景（类似 ChatGPT 打字效果）
    // res 是 Express 的 Response 对象，用于向客户端推送数据
    async streamChat(message: string, res: Response) {
        // 设置 SSE 响应头
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        // stream 返回一个 AsyncIterable<AIMessage> 对象，每次产出一个 chunk
        const stream = await this.llm.stream([new HumanMessage(message)]);
        // 逐个 chunk 推送给客户端
        for await (const chunk of stream) {
            // chunk.content 是这个片段的文字内容
            if (chunk.content) {
                // SSE 格式：data: 内容\n\n
                res.write(`data: ${JSON.stringify({ text: chunk.content })}\n\n`);
            }
        }
        // 发送结束标志
        res.write('data: [DONE]\n\n');
        res.end();
    }

    // 4：使用pipe链式调用
    // StringOutputParser 把 AIMessage 对象转成纯字符串
    async chatWithParse(message: string) {
        // pipe 是 LangChain 的管道操作符
        // llm → StringOutputParser 构成一个简单的链式调用
        const chain = this.llm.pipe(new StringOutputParser())
        
        // invoke 返回的是字符串，不是 AIMessage 对象
        const answer = await chain.invoke([new HumanMessage(message)]);
        return {
            question: message,
            answer
        }
    }
}
