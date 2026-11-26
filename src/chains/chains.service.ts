import { Injectable } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import {HumanMessage, SystemMessage} from '@langchain/core/messages';
import { ChatPromptTemplate, PromptTemplate, FewShotChatMessagePromptTemplate } from '@langchain/core/prompts';
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { config } from '../config.js';

@Injectable()
export class ChainsService {
    // 创建 ChatOllama 实例
    // 所有参数从 config 读取，方便统一管理
    private llm = new ChatOllama({
        model: config.ollama.chatModel,
        baseUrl: config.ollama.baseUrl,
        temperature: config.ollama.temperature,
        think: false,
    });

    private parser = new StringOutputParser();

    // 1 简单线性链
    // 场景： 文章润色
    async polishArticle(article: string) {
        // 1 分析文章
        const analyzePrompt = ChatPromptTemplate.fromMessages([
            ["system", "你是专业编辑，只输出问题列表，不要其他内容。"],
            ["human", "分析这篇文章存在哪些问题：\n\n{article} "],
        ]);

        // 根据问题列表润色文章
        const polishPrompt = ChatPromptTemplate.fromMessages([
            ["system", "你是专业编辑，根据问题列表润色文章，保持原意，只输出润色后的文章，不要其他内容。"],
            ["human", "原文：\n{article}\n\n{issues}\n\n请输出润色后的文章： "],
        ]);

        // 第一条链 article -> 分析问题 -> issues
        const analyzeChain = analyzePrompt.pipe(this.llm).pipe(this.parser);

        // 第二条链 article, issues -> 润色文章 -> polishedArticle
        const polishChain = polishPrompt.pipe(this.llm).pipe(this.parser);

        // RunnableSequence 将两条链串联起来
        const fullChain = RunnableSequence.from([
            // 第一步： 保留原文 并调用分析链得到issues
            {
                article: new RunnablePassthrough(), 
                issues: analyzeChain
            },
            // 第二步： 调用润色链得到润色后的文章
            polishChain
        ]);
        const result = await fullChain.invoke({ article });
        return {original: article, polished: result};
    }

    // 2 顺序链
    // 场景： 生成小说
    async generateNovel(keywords: string, style: string) {
        // 1 生成小说大纲
        const outlinePrompt = ChatPromptTemplate.fromMessages([
            ["system", "你是专业小说家，根据关键词和风格生成小说大纲，只输出大纲，不要正文。"],
            ["human", "根据关键词：{keywords}\n风格：{style}\n请生成小说大纲（3-5章节）： "],
        ]);
        // 2 根据大纲生成小说
        const contentPrompt = ChatPromptTemplate.fromMessages([
            ["system", "你是专业小说家，按照大纲写出完整小说，不要额外输出其他没内容"],
            ["human", "小说大纲：\n{outline}\n\n请输出完整小说： "],
        ]);
        // 3 生成标题
        const titlePrompt = ChatPromptTemplate.fromMessages([
            ["system", "你是小说资深编辑，输出吸引人的小说标题，只输出标题，不要其他内容。"],
            ["human", "根据以下小说：\n{article}\n\n生成3个吸引人的小说标题： "],
        ]);

        //  执行第一步
        const outlineChain = outlinePrompt.pipe(this.llm).pipe(this.parser);
        const outline = await outlineChain.invoke({ keywords, style });

        //  执行第二步
        const contentChain = contentPrompt.pipe(this.llm).pipe(this.parser);
        const content = await contentChain.invoke({ outline });

        //  执行第三步
        const titleChain = titlePrompt.pipe(this.llm).pipe(this.parser);
        const titles = await titleChain.invoke({ article: content });
        return {
            keywords,
            style,
            outline,
            content,
            titles
        };
    }

    // 3 条件链
    // 场景 智能客服路由
    async smartRouter(question: string) {
        // 1 问题分类
        const classifyPrompt = ChatPromptTemplate.fromMessages([
            ["system", `你是智能客服，根据问题分类，只输出分类标签，不要其他内容。
                - 技术问题 -> 输出： TECH
                - 退款问题 -> 输出： REFUND
                - 投诉问题 -> 输出： COMPLAINT
                - 其他问题 -> 输出： OTHER`],
            ["human", "问题：\n{question}\n\n请输出问题分类： "],
        ]);
        const classifyChain = classifyPrompt.pipe(this.llm).pipe(this.parser);
        const category = await classifyChain.invoke({ question });

        // 2 根据分类选择对应客服
        const prompts = {
            TECH: "你是技术支持专家，专业解答技术问题，给出具体的操作步骤",
            REFUND: "你是退款专员，引导用户完成退款流程, 态度友好",
            COMPLAINT: "你是客户关系专员，认真对待客户投诉，给出妥善解决方案",
            OTHER: "你是通用客服，友好回答其他各类问题",
        }

        // 根据分类选择对应客服
        const systemPrompt = prompts[category as keyof typeof prompts] as string;
        const answerPrompt = ChatPromptTemplate.fromMessages([
            ["system", systemPrompt],
            ["human", "问题：\n{question}\n\n请输出回答： "],
        ]);
        // 执行链
        const answerChain = answerPrompt.pipe(this.llm).pipe(this.parser);
        const answer = await answerChain.invoke({ question });
        return {
            question,
            category,
            answer
        };
    }

}
