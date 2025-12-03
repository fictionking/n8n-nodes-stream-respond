
# n8n-nodes-stream-respond
![Stream Respond Node](icons/icon.png)
这个 n8n 社区节点包提供了 Stream Respond 节点，允许你在 n8n 工作流中实现流式响应功能，将数据流式传输到 Stream Trigger。

## 功能特性

- **多种 Chunk 类型**：支持发送不同类型的流事件（完整流、单个项目、开始事件、结束事件、错误事件）
- **完整流模式**：一键发送完整的流序列（begin + 所有items + end）
- **灵活的内容配置**：为每种流事件类型配置自定义内容
- **延迟控制**：可设置发送每个流事件后的延迟时间
- **版本兼容性检查**：自动检查 n8n 版本是否支持流式功能

## 节点说明

### Stream Respond 节点

**功能**：将数据流式传输到 Stream Trigger，支持多种流事件类型。

**输入**：
- Main 输入：包含要流式传输的数据项

**参数**：
- **Chunk Type**：选择要发送的流事件类型
  - `Complete (Begin + Items + End)`：发送完整流序列
  - `Item`：发送单个内容块（如文本 token）
  - `Begin`：指示流的开始
  - `End`：指示流的结束
  - `Error`：向聊天发送错误事件
- **Begin Content**：为开始事件定义字符串内容（仅在 Complete 或 Begin 模式下可见）
- **Item Content**：为每个项目块定义字符串内容（仅在 Complete 或 Item 模式下可见）
- **End Content**：为结束事件定义字符串内容（仅在 Complete 或 End 模式下可见）
- **Error Content**：为错误事件定义字符串内容（仅在 Error 模式下可见）
- **Delay (ms)**：发送每个块后的等待时间

**输出**：
- Main 输出：原始输入数据（未修改）

## 核心工作原理

该节点通过 n8n 的 `sendChunk` API 实现流式数据传输，主要功能包括：

1. **版本兼容性检查**：确保当前 n8n 版本支持流式功能
2. **Chunk 构建**：根据配置的事件类型和内容构建流数据
3. **事件发送**：使用 `sendChunk` API 发送流事件
4. **延迟处理**：支持在发送流事件之间添加延迟
5. **错误处理**：支持发送错误事件，并处理可能的执行错误

### 完整流模式（Complete）

在 Complete 模式下，节点会按照以下顺序发送流事件：
1. 发送 begin 事件（带有配置的 Begin Content）
2. 为每个输入数据项发送 item 事件（带有配置的 Item Content）
3. 发送 end 事件（带有配置的 End Content）

## 安装

### 方法 1：直接安装（推荐）

在 n8n 中，转到 "Settings > Community Nodes"，搜索并安装 `n8n-nodes-stream-respond` 包。

### 方法 2：手动安装

1. 克隆此仓库
```bash
git clone https://github.com/yourusername/n8n-nodes-stream-respond.git
cd n8n-nodes-stream-respond
```

2. 安装依赖
```bash
npm install
```

3. 构建项目
```bash
npm run build
```

4. 链接到 n8n
```bash
npm link
```

5. 在 n8n 中启用开发模式
```bash
n8n start --dev
```

## 使用示例

### 示例 1：实现 AI 流式响应

1. 添加一个 Chat Trigger 节点，启用 "Response Mode: Streaming"
2. 添加一个 AI 节点（如 OpenAI Completions），配置生成文本
3. 添加 Stream Respond 节点，设置：
   - Chunk Type：`Complete (Begin + Items + End)`
   - Begin Content：`"Response started..."`
   - Item Content：`{{$json.text}}`（假设 AI 节点输出包含 text 字段）
   - End Content：`"Response completed!"`
   - Delay：`10`（毫秒）
4. 连接 AI 节点到 Stream Respond 节点的 Main 输入
5. 执行工作流，观察流式响应效果

### 示例 2：发送单个流事件

1. 添加一个 Stream Trigger 节点
2. 添加一个 Code 节点，生成单个数据项
3. 添加 Stream Respond 节点，设置：
   - Chunk Type：`Item`
   - Item Content：`"This is a single stream item"`
4. 连接 Code 节点到 Stream Respond 节点
5. 执行工作流，观察单个流事件的发送

## 配置字段说明

### Chunk Type

选择要发送的流事件类型，决定了节点的行为：

- **Complete**：发送完整的流序列（begin + items + end）
- **Item**：为每个输入数据项发送一个 item 事件
- **Begin**：发送一个 begin 事件，指示流的开始
- **End**：发送一个 end 事件，指示流的结束
- **Error**：发送一个 error 事件，用于报告错误

### Content 字段

根据选择的 Chunk Type，节点会显示对应的 Content 字段：

- **Begin Content**：begin 事件的内容
- **Item Content**：item 事件的内容，可使用 n8n 表达式（如 `{{$json.field}}`）
- **End Content**：end 事件的内容
- **Error Content**：error 事件的内容

### Delay

设置发送每个流事件后的延迟时间（毫秒），用于控制流的速度。

## 开发

如果你想为此项目做贡献或修改代码：

1. 启动开发模式
```bash
npm run dev
```

2. 代码检查
```bash
npm run lint
```

3. 自动修复代码问题
```bash
npm run lint:fix
```

4. 构建项目
```bash
npm run build
```

## 技术栈

- TypeScript
- n8n-workflow

## 兼容性

该节点需要 n8n 版本支持 `sendChunk` API。如果你的 n8n 版本不支持此功能，节点会显示错误提示。

## License

[MIT](LICENSE.md)
