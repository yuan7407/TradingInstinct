# 架构决策记录

## 平台选择：微信小程序
- **决策**: 微信小程序作为 MVP 平台
- **原因**: 零安装（扫码即用）/ 社交裂变（微信内分享）/ 中国市场最大流量入口 / 低成本试错
- **AppID**: `wx08c5a364db7c3099`

## 技术栈：uni-app + Vue 2
- **决策**: 使用 uni-app 框架 + Vue 2，不用 TypeScript
- **原因**: MVP 阶段速度优先，uni-app 跨平台能力（日后可扩展到 H5/App），Vue 2 生态成熟稳定
- **构建**: `npm run dev:mp-weixin` → `dist/dev/mp-weixin/`

## 4 页面独立架构
- **决策**: welcome / index / result / ranking 四个独立页面
- **原因**: 页面职责单一，互不干扰，避免单文件过大
- **隔离原则**: 修改 index 不影响 result，修改 welcome 不影响 ranking
- **实际**: index.vue 已达 2794 行（集成了 Canvas + 手势 + 选择器 + 全部游戏逻辑）

## 3 工具模块分离
- **决策**: config.js / stockData.js / aiAnalysis.js 三个独立工具
- **config.js**: 所有配置集中（API/游戏参数/UI颜色/周期/股票池），不在其他文件硬编码
- **stockData.js**: 数据获取 / 归一化 / 缓存 / Mock降级，与 UI 解耦
- **aiAnalysis.js**: 双层AI（快速本地+深度DeepSeek），可独立替换

## Canvas 2D API（从 1.0 升级）
- **决策**: 使用微信推荐的 Canvas 2D API（`type="2d"`）
- **原因**: Canvas 1.0 性能差，2D API 支持更好的渲染管线
- **获取方式**: `wx.createSelectorQuery().select('#klineCanvas').node()`

## 双层 AI 分析
- **决策**: 快速本地规则（每次决策后即时）+ DeepSeek 深度分析（结算页）
- **原因**: 即时反馈需要 <100ms，DeepSeek API 延迟 2-5s 只适合结算
- **降级**: DeepSeek 不可用时（402/网络）→ 本地规则兜底

## 非响应式手势状态
- **决策**: 手势相关变量用 `_` 前缀（`_startX`, `_isDragging`, `_axis`），不放入 Vue data
- **原因**: touchmove 每帧触发，如果放入 data 会触发 setData → 性能灾难
- **规则**: 只有需要触发 UI 更新的状态才放 data（如 `showBuy`, `cardClass`）

## 配置集中化
- **决策**: 所有游戏参数、API端点、UI颜色、时间周期配置集中在 config.js
- **导出**: API_CONFIG / GAME_CONFIG / MARKET_RULES / PRESET_LEVELS / TIME_PERIODS / UI_CONFIG
- **原因**: 避免魔法数字散落在 2794 行的 index.vue 中
