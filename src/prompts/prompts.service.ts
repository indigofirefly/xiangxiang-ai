import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { ChatOllama } from '@langchain/ollama';
import {HumanMessage, SystemMessage} from '@langchain/core/messages';
import { ChatPromptTemplate, PromptTemplate, FewShotChatMessagePromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { config } from '../config.js';

@Injectable()
export class PromptsService {

    // 创建 ChatOllama 实例
    // 所有参数从 config 读取，方便统一管理
    private llm = new ChatOllama({
        model: config.ollama.chatModel,
        baseUrl: config.ollama.baseUrl,
        temperature: config.ollama.temperature,
        think: false,
    });

    // 1 翻译文本 
    async translateText( text: string, targetLanguage: string) {
        // fromMessages 接收消息数组，每个元素是 [role(角色), content(内容)] 格式 
        // content 里的 {变量名} 是占位符，invoke 时自动替换
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", "你是一个专业的翻译助手,只输出翻译结果,不要加任何解释。"],
            ["human", "请将以下内容翻译为{targetLanguage}：\n\n{text} "],
        ]);
        // !TODO: Note==> pipe 把 prompt、llm、parser 串联成链
        const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

        // invoke 传入变量值，替换占位符
        const result = await chain.invoke({ text, targetLanguage});
        return {
            originalText: text,
            targetLanguage,
            translatedResult: result,
        }
    }

    // 2 总结文本 (单消息模板)
    // 比 ChatPromptTemplate 简单，适合只有一条 human 消息的场景
    async summarizeText( text: string, maxWords: number) {
        const prompt = PromptTemplate.fromTemplate("请用不超过{maxWords}个字总结以下内容，只输出总结，不要加其他内容：\n\n{text} ");
        const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());
        const result = await chain.invoke({ text, maxWords});
        return { originalText: text, maxWords, summarizedResult: result};
    }

    // 3 Few-Shot Prompt
    // 给模型提供几个示例，让模型学会输出格式
    // 适合需要严格控制输出格式的场景
    async classifyText( text: string ) {
        // 示例数组：展示正确的输入输出格式
        const examples = [
            { input: "这个产品太棒了！", output: "正面" },
            { input: "这个产品太差了！", output: "负面" },
            { input: "这个产品一般般！", output: "中性" },
            { input: "强烈推荐，超出预期！", output: "正面" },
            { input: "非常失望，不推荐！", output: "负面" },
            { input: "一般般，没有惊喜！", output: "中性" },
        ];
        // 单个示例的格式模板
        const examplePrompt = ChatPromptTemplate.fromTemplate("输入: {input}，输出: {output}");

        // FewShotPromptTemplate 把示例和真实问题组合在一起
        const fewShotPrompt = new FewShotChatMessagePromptTemplate({
            examples,
            examplePrompt,
            prefix: '你是专业的情感分类助手，请根据以下示例，将以下内容分类为正面、负面或中性之一：',
            suffix: '输入: {input}\n输出: ',
            inputVariables: ['input'],
        });
         // FewShotPromptTemplate 最终格式化成一个字符串
        // 然后作为 human 消息发给模型
        const formattedPrompt = await fewShotPrompt.format({
            input: text,
        });
        
        const response = await this.llm.invoke(formattedPrompt);
        return { text, sentiment: String(response.content).trim(),};
    }

    // code-review
    async codeReview( code: string, language: string) {
        
        const reviewPrompt = ChatPromptTemplate.fromMessages([
            ["system", `你是一个资深的{language}开发工程师，负责代码审查。
                审查维度：
                1. 代码规范
                2. 潜在BUG
                3. 性能问题
                4. 安全问题
                输出格式：
                - 总体评分（1-10分）
                - 具体问题列表
                - 改进后的代码 （如有必要）`
            ],
            ["human", "请审查以下{language}代码，并给出审查结果：\n\n```{language}\n{code}\n``` "],
        ]);
        const chain = reviewPrompt.pipe(this.llm).pipe(new StringOutputParser());
        const result = await chain.invoke({ code, language});
        return { code, language, reviewResult: result};
    }
}
