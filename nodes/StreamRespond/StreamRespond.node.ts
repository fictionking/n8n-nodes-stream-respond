import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class StreamRespond implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Stream Respond',
		name: 'respondToStream',
		icon: 'file:../../icons/icon.png',
		group: ['transform'],
		version: 1,
		description: 'Streams data to a Stream Trigger with a specific event type',
		defaults: {
			name: 'Stream Respond',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Chunk Type',
				name: 'chunkType',
				type: 'options',
				options: [
					{
						name: 'Complete (Begin + Items + End)',
						value: 'complete',
						description: 'Sends a complete stream: begin event before items, all items, and end event after all items',
					},
					{
						name: 'Item',
						value: 'item',
						description: 'Standard content chunk (e.g. text token)',
					},
					{
						name: 'Begin',
						value: 'begin',
						description: 'Indicates the start of a stream',
					},
					{
						name: 'End',
						value: 'end',
						description: 'Indicates the end of a stream',
					},
					{
						name: 'Error',
						value: 'error',
						description: 'Sends an error event to the chat',
					},
				],
				default: 'complete',
				description: 'The type of chunk to send',
			},
			{
				displayName: 'Begin Content',
				name: 'beginContent',
				type: 'string',
				description: 'Define the string content for the begin event',
				default: '',
				displayOptions: {
					show: {
						'chunkType': ['complete', 'begin'],
					},
				},
			},
			{
				displayName: 'Item Content',
				name: 'itemContent',
				type: 'string',
				description: 'Define the string content for each item chunk',
				default: '',
				displayOptions: {
					show: {
						'chunkType': ['complete', 'item'],
					},
				},
			},
			{
				displayName: 'End Content',
				name: 'endContent',
				type: 'string',
				description: 'Define the string content for the end event',
				default: '',
				displayOptions: {
					show: {
						'chunkType': ['complete', 'end'],
					},
				},
			},
			{
				displayName: 'Error Content',
				name: 'errorContent',
				type: 'string',
				description: 'Define the string content for the error event',
				default: '',
				displayOptions: {
					show: {
						'chunkType': ['error'],
					},
				},
			},
			{
				displayName: 'Delay (ms)',
				name: 'delay',
				type: 'number',
				default: 10,
				description: 'Wait time after sending this chunk',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// 构建 payload 的辅助函数 - 直接返回字符串值
		const buildPayload = (chunkType: string, index: number): string => {
			// 根据 chunkType 获取对应的 content 配置参数名
			// chunkType 到 contentParamName 的映射表
			const contentParamMap: Record<string, string> = {
				begin: 'beginContent',
				end: 'endContent',
			error: 'errorContent',
				item: 'itemContent'
			};
			
			const paramName = contentParamMap[chunkType] || 'itemContent';
			
			// 获取参数值 - 直接获取字符串内容
			try {
				return this.getNodeParameter(paramName, index, '') as string;
			} catch (error) {
				// 如果获取失败，返回空字符串
				return '';
			}
		};

		// 检查参数是否是表达式的辅助函数
		const isExpression = (paramName: string): boolean => {
			try {
				// 获取原始参数值，不解析表达式
				const rawValue = this.getNodeParameter(paramName, 0, '', { rawExpressions: true }) as string;
				// 在 n8n 中，表达式通常以 = 开头
				return rawValue.trim().startsWith('=');
			} catch (error) {
				// 如果获取失败，默认认为是表达式
				return true;
			}
		};
		
		// 发送 chunk 并处理延迟的辅助函数
		const sendChunkWithDelay = async (chunkType: string, index: number, payload: string) => {
			// 发送 chunk 事件
			// @ts-ignore
			this.sendChunk(chunkType, index, payload);
			
			// 处理延迟
			if (delay > 0) {
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		};
		
		// 处理所有 items 的辅助函数
		const processItems = async () => {
			// 检查 itemContent 是否是表达式
			const itemContentIsExpression = isExpression('itemContent');
			
			if (itemContentIsExpression) {
				// 如果是表达式，需要为每个 item 生成不同的 payload
				for (let i = 0; i < items.length; i++) {
					try {
						// 构建 item payload
						const itemPayload = buildPayload('item', i);
						await sendChunkWithDelay('item', i, itemPayload);
					} catch (error) {
						if (this.continueOnFail()) {
							continue;
						}
						throw error;
					}
				}
			} else {
				// 如果是固定值，只需要发送一次
				try {
					// 构建 item payload (使用第一个 item 的索引)
					const itemPayload = buildPayload('item', 0);
					await sendChunkWithDelay('item', 0, itemPayload);
				} catch (error) {
					if (this.continueOnFail()) {
						// 继续执行，但不处理错误
					} else {
						throw error;
					}
				}
			}
		};
		

		const items = this.getInputData();

		// 1. 检查 n8n 版本兼容性 (是否有 sendChunk 方法)
		// @ts-ignore
		if (typeof this.sendChunk !== 'function') {
			throw new NodeOperationError(
				this.getNode(),
				'This version of n8n does not support streaming (sendChunk is missing). Please upgrade.',
			);
		}

		// 获取第一个 item 的参数来决定是否使用 auto 模式
		const chunkType = this.getNodeParameter('chunkType', 0) as string;
		const delay = this.getNodeParameter('delay', 0) as number;

		// 如果是 complete 模式
		if (chunkType === 'complete') {
			try {
				// 1. 构建并发送 begin 事件
				const beginPayload = buildPayload('begin', 0);
				await sendChunkWithDelay('begin', 0, beginPayload);

				// 2. 发送所有 items
				await processItems();

				// 3. 构建并发送 end 事件
				const endPayload = buildPayload('end', 0);
				await sendChunkWithDelay('end', items.length - 1, endPayload);

			} catch (error) {
				if (this.continueOnFail()) {
					// 继续执行，但不处理错误
				} else {
					throw error;
				}
			}
		} else {
			// 非 complete 模式
			// 只有 item 类型为每个 item 发送 chunk，其他类型只发送一个 chunk
			if (chunkType === 'item') {
				// item 类型：为每个 item 发送一个 chunk
				await processItems();
			} else {
				// 其他类型（begin, end, error）：只发送一个 chunk
				try {
					// 构建 payload 并发送
					const chunkPayload = buildPayload(chunkType, 0);
					await sendChunkWithDelay(chunkType, 0, chunkPayload);

				} catch (error) {
					if (this.continueOnFail()) {
						// 继续执行，但不处理错误
					} else {
						throw error;
					}
				}
			}
		}

		return [items];
	}
}