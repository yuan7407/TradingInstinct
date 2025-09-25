# 思维导图（可编辑，Mermaid + 文本）

下面提供 Mermaid 兼容的流程图/导图代码，你可以粘到支持 Mermaid 的工具（例如 Typora、Obsidian、Mermaid live editor）中查看或编辑。

```mermaid
flowchart TB
  A[盘感 Trading Instinct]
  A --> UX[用户体验]
  UX --> UX1[立即上手]
  UX --> UX2[滑动预测]
  UX --> UX3[结算与AI点评]
  A --> GM[游戏机制]
  GM --> GM1[历史切片库]
  GM --> GM2[回合5-10步]
  GM --> GM3[信心倍数]
  A --> TECH[技术架构]
  TECH --> B1[微信小程序前端]
  TECH --> B2[Python后端指标计算]
  TECH --> B3[数据缓存]
  A --> GTM[增长与变现]
  GTM --> G1[社交流量裂变]
  GTM --> G2[订阅/教育合作]
  GTM --> G3[B端数据服务]
```

## 文本版思维结构
- 用户体验
  - 立即上手、滑动预测、结算页、AI点评、分享
- 游戏机制
  - 切片库、难度均衡、信心倍数、得分机制
- 技术
  - 小程序前端、Python 后端、缓存历史切片、Claude 解释代理
- 增长与商业化
  - 社交流量、教学增值、品牌合作、数据服务
