// src/config.ts
// 所有可变参数集中在这里，换模型只改这一个文件
export const config = {
    ollama: {
        // 基础 URL：ollama 服务地址
        baseUrl: "http://localhost:11434",
        
        // 聊天模型：用于生成文本，可选 qwen3.5:0.8b 或 deepseek-r1:32b
        // 默认选 确认已拉取：ollama pull qwen3.5:0.8b
        chatModel: "qwen3.5:4b",
        
        // 嵌入模型：用于计算文本向量，可选 mxbai-embed-large 或 nomic-embed-text
        // 默认选 确认已拉取：ollama pull mxbai-embed-large
        embedModel: "mxbai-embed-large",
        
        // 温度：0 = 最保守，1 = 最随机
        // 知识问答用 0.1~0.3，创意写作用 0.7~1.0
        temperature: 0.1,
    }
};  