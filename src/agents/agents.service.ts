import { Injectable } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { tool, type StructuredToolInterface } from '@langchain/core/tools';
import {
    HumanMessage,
    AIMessage,
    SystemMessage,
    ToolMessage,
    type BaseMessage,
} from '@langchain/core/messages';
import { z } from 'zod';
import { config } from '../config.js';
@Injectable()
export class AgentsService {

    // 创建 ChatOllama 实例
    // 所有参数从 config 读取，方便统一管理
    private llm = new ChatOllama({
        model: config.ollama.chatModel,
        baseUrl: config.ollama.baseUrl,
        temperature: config.ollama.temperature,
        think: false,
    });

    // 定义工具
    // 工具就是模型可以调用的函数
    // tool 包装器，将函数包装成LangChain可以识别的工具格式

    // 计算器工具
    private calculatorTool = tool(
        async({expression}: {expression: string}) => {
            try {
                const result = new Function(`return ${expression}`)();
                return `计算结果：${expression} = ${result}`;
            } catch (error) {
                return {
                    result: `计算出错，无法计算 ${expression}`,
                }
            }
        },
        {
            name: 'calculator',
            description: 'A tool for calculating the result of a mathematical expression',
            schema: z.object({
                expression: z.string().describe('数学表达式，例如: 5 + 7 * 3'),
            }),
        }
    );

    // 获取当前时间
    private timeTool = tool(
        async() => {
            const now = new Date();
            return `当前时间：${now.toLocaleString(`zh-CN`, { timeZone: 'Asia/Shanghai' })}`;
        },
        {
            name: 'get_current_time',
            description: '获取当前的日期和时间',
            schema: z.object({}),
        }
    )

    // 单位换算
    private unitConversionTool = tool(
        async({ value, fromUnit, toUnit }: {value: number, fromUnit: string, toUnit: string}) => {
            const conversionRate: Record<string, Record<string, number>> = {
                "km": {
                    "m": 1000,
                    "cm": 100000,
                    "mm": 1000000,
                },
                "m": {
                    "km": 0.001,
                    "cm": 100,
                    "mm": 1000,
                },
                // 温度（特殊处理）
                celsius: { fahrenheit: 1 },
                fahrenheit: { celsius: 1 },
            }

            // 温度特殊换算
            if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
                const result = value * 9 / 5 + 32
                return `${value}°C = ${result.toFixed(2)}°F`
            }
            if (fromUnit === 'fahrenheit' && toUnit === 'celsius') {
                const result = (value - 32) * 5 / 9
                return `${value}°F = ${result.toFixed(2)}°C`
            }

            // 长度换算
            const rate = conversionRate[fromUnit]?.[toUnit]
            if (rate === undefined) return `无法转换单位: ${fromUnit} 到 ${toUnit}`

            const converted = (value * rate).toFixed(2)
            return `${value} ${fromUnit} = ${converted} ${toUnit}`
        },
        {
            name: 'unit_conversion',
            description: '将一个单位转换为另一个单位, 支持长度（km/m/cm/mm）和温度（celsius/fahrenheit）换算',
            schema: z.object({
                value: z.number().describe('要转换的值'),
                from: z.string().describe('原始单位'),
                to: z.string().describe('目标单位'),
            }),
        }
    )

    async runAgent(userMessage: string) {
        // 把所有工具绑定到模型
        const tools = [this.calculatorTool, this.timeTool, this.unitConversionTool];
        // bindTools 让模型知道有哪些工具可以调用
        const llmWithTools = this.llm.bindTools(tools);
        
        // 定义工具映射。收成同一接口，避免联合类型上的 invoke 无法调用
        const toolMap: Record<string, StructuredToolInterface> = {
            'calculator': this.calculatorTool,
            'get_current_time': this.timeTool,
            'unit_conversion': this.unitConversionTool,
        };
        
        // 定义消息列表
        const messages:(HumanMessage | AIMessage | SystemMessage | ToolMessage)[] = [
            new HumanMessage(userMessage),
        ];
        const steps: string[] = [];
        // agent循环： 最多执行5轮 防止无限循环
        for (let i = 0; i < 5; i++) {
            // 调用模型 让模型决定下一步做什么
            const response = await llmWithTools.invoke(messages);
            messages.push(response);

            // 如果模型没有工具调用，则认为模型已经给出了最终答案
            if (!response.tool_calls || response.tool_calls.length === 0) {
                steps.push(`[最终答案]: ${response.content}`);
                break;
            }

            // 如果模型有工具调用，则调用工具
            for (const toolCall of response.tool_calls || []) {
                // 找到对应的工具函数
                const toolFn = toolMap[toolCall.name as keyof typeof toolMap];
                // 如果找不到工具，则认为工具调用失败
                if (!toolFn) {
                    steps.push(`[工具调用失败]: 无法找到工具 ${toolCall.name}`);
                    continue;
                }
                steps.push(`[工具调用]: ${toolCall.name} - ${JSON.stringify(toolCall.args)}`);
                
                // 执行工具函数 获取结果
                const toolResult = await toolFn.invoke(toolCall.args);
                steps.push(`[工具调用结果]: ${JSON.stringify(toolResult)}`);
                
                // 把工具结果添加到消息列表 让模型看到结果后继续思考
                messages.push(new ToolMessage({
                    content: String(toolResult),
                    tool_call_id: toolCall?.id || '',
                }));
            }
        }
        // 获取最终答案
        const lastAIMessage = [ ...messages ].reverse().find(message => AIMessage.isInstance(message)) as AIMessage | undefined;
        const finalResponse = lastAIMessage?.content || '无法获取最终答案';
        
        return {
            question: userMessage,
            steps,
            answer: finalResponse,
        }
    }
}