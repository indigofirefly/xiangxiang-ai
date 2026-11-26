import { Injectable } from '@nestjs/common';

import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { config } from '../config.js';

@Injectable()
export class RagService {

    // 创建 ChatOllama 实例
    // 所有参数从 config 读取，方便统一管理
    private llm = new ChatOllama({
        model: config.ollama.chatModel,
        baseUrl: config.ollama.baseUrl,
        temperature: config.ollama.temperature, // RAG 场景用低温度，让回答更准确
    });

    // OllamaEmbeddings 把文本转成向量（用于相似度检索）
    private embeddings = new OllamaEmbeddings({
        model: config.ollama.embedModel,
        baseUrl: config.ollama.baseUrl,
    });

    // MemoryVectorStore: 内存向量库 （无需部署 Chroma）
    // 内存向量存储，用于存储文本向量 生产环境 切换 Chroma 等其他向量存储
    private vectorStore: MemoryVectorStore | null = null;

    // 记录已加载文档数
    private docCount = 0

    // 加载文档到向量库
    async loadDocuments(documents: { id: string, content: string, source: string }[]) {
        
        // 文本分块器 将长文本切成chunk
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 100, // 每个chunk 500字符
            chunkOverlap: 20, // 重叠部分 200字符
            separators: ['\n\n', '\n', '。', '！', '？', ' ', '']
        });

        const allDocs: Document[] = [];

        for (const doc of documents) {
            // createDocuments 把文本切成多个 Document 对象
            const chunks = await splitter.createDocuments(
                [doc.content],
                [{ source: doc.source || doc.id, docId: doc.id }]
            );
            allDocs.push(...chunks);
        }

        // 创建内存向量库，自动对所有文档向量化
        this.vectorStore = await MemoryVectorStore.fromDocuments(
            allDocs,
            this.embeddings,
        );

        this.docCount = documents.length;
        
        return {
            success: true,
            originalDocs: documents.length,
            totalChunks: allDocs.length,
            message: `成功加载 ${documents.length} 篇文档，共切为 ${allDocs.length} 个块`,
        }
    }

    // 查询向量库
    async search(query: string, topK: number = 3) {
        if (!this.vectorStore) {
            throw new Error('请先调用/rag/load-documents 加载文档');
        }

        // similaritySearchWithScore  返回 [Document, score] 数组
        // score是余弦相似度 越高越相关
        const results = await this.vectorStore.similaritySearchWithScore(query, topK);
        
        return {
            query,
            results: results.map(([doc, score]) => ({
                content: doc.pageContent,
                source: doc.metadata.source,
                score: parseFloat(score.toFixed(4)),
            })),
        };
    }

    // 生成RAG回答
    async query(question: string, topK: number = 3) {
        if (!this.vectorStore) {
            throw new Error('请先调用/rag/load-documents 加载文档');
        }

        // 1 检索最相关文档块
        const retrieved = await this.vectorStore.similaritySearchWithScore(question, topK);
        
        console.log(`retrieved==> ${JSON.stringify(retrieved)}`);
        if (retrieved.length === 0) {
            return {
                question,
                answer: '没有找到相关文档',
                sources: []
            };
        }

        // 2 把检索到的文档拼接成 context
        const context = retrieved.map(([doc, i]) => `[${i + 1}] ${doc.pageContent}`).join('\n\n');

        // 3 构建rag prompt
        const prompt = ChatPromptTemplate.fromMessages([
            [
                'system', `你是知识库问答助手，你是知识库问答助手，严格基于以下参考资料回答问题。
规则：
1. 只根据参考资料内容回答，不要使用资料外的知识
2. 如果资料中没有相关信息，回答"知识库中暂无相关内容"
3. 回答简洁准确，使用中文
4. 可以说明答案来自第几条参考资料

参考资料：
{context}`,   
            ],
            ['human', `问题：{question}`]
        ]);

        // 4 调用模型生成答案
        const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());
        const answer = await chain.invoke({
            question: question,
            context: context,
        });

        return {
            question,
            answer,
            sources: retrieved.map(([doc, score]) => ({
                content: doc.pageContent,
                source: doc.metadata.source,
                docId: doc.metadata.docId,
                score: parseFloat(score.toFixed(4)),
            }))
        };
    }

    // 获取知识库状态
    getSatus() {
        return {
            loaded: this.vectorStore !== null,
            docCount: this.docCount,
            message: this.vectorStore ? `知识库已加载 ${this.docCount} 篇文档` : '知识库为空，请先加载文档',
        }
    }
    
    // 清空知识库
    clear() {
        this.vectorStore = null;
        this.docCount = 0;
        return { success: true, message: '知识库已清空' }
    }

}
