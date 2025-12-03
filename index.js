/**
 * n8n-nodes-stream-respond
 * 
 * Stream Respond node for n8n with Stream Model support
 * This package provides nodes to stream data to a Stream Trigger with a specific event type.
 * 
 * @module n8n-nodes-stream-respond
 */

// 导出节点配置，采用简洁的实现风格
module.exports = {
  // 导出节点
  nodes: [
    require('./dist/nodes/StreamRespond/StreamRespond.node.js'),
  ],
  // 从package.json动态获取版本号，避免硬编码
  version: require('./package.json').version,
};

// 为了保持兼容性，额外导出节点类
const StreamRespondNode = require('./dist/nodes/StreamRespond/StreamRespond.node.js');

// 兼容旧版n8n的直接节点类访问
module.exports.StreamRespondNode = StreamRespondNode.StreamRespond;

