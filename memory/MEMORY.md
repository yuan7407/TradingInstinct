# Trading Instinct（盘感）- Claude 记忆索引
<!-- 此文件自动加载到每次对话的系统提示中，≤150行，每一行都是黄金 -->

## 当前状态
- 前端核心功能完成（welcome, index, result 页面），ranking 待后端接入
- **双模式系统**: 新手面积图 + 真实蜡烛图
- **A股/港股真实数据**: 东方财富 API（无需 Key），美股/加密走 Massive
- 股票选择器卡片轮盘（58只股票，动态背景+市场边框）
- 后端: API 规格文档已完成，Michael 尚未开始实现
- AppID: `wx08c5a364db7c3099`

## 架构速查
- 入口: `src/pages/` 下 4 个页面（welcome/index/result/ranking）
- 核心: `index/index.vue` (~2800行) — K线 Canvas + 滑动交易 + 股票选择器
- 配置: `src/utils/config.js` — API_CONFIG / GAME_CONFIG / MARKET_RULES / PRESET_LEVELS / TIME_PERIODS
- 数据: `src/utils/stockData.js` — K线获取（自动路由 Massive/东方财富）/ 归一化 / 缓存 / Mock降级
- AI层: `src/utils/aiAnalysis.js` — 快速本地规则(即时) + DeepSeek深度(结算)
- 页面独立: 修改 index 不影响 result，修改 welcome 不影响 ranking

## 数据源路由
- `fetchHistoricalData()` 根据 `detectMarket(symbol)` 自动路由
- 美股/加密 → `fetchMassiveData()`（Massive/Polygon API，需 Key）
- A股/港股 → `fetchEastMoneyData()`（东方财富 API，免费）
- secid 映射: 上海A股 `1.600519`，深圳A股 `0.300750`，港股 `116.00700`
- 东方财富返回 open,**close**,high,low（close 在第2列），时间升序无需 reverse
- 分钟/小时级 klt 自动扩展请求日期 +14天（覆盖节假日）

## 关键规则（必须遵守）
- **所有模式统一整数股**: `Math.max(1, Math.floor(budget / currentPrice))`，禁止小数股
- **手势变量非响应式**: `_startX`, `_isDragging` 等用 `_` 前缀，touchmove 中零 setData
- **Canvas 引用必须缓存**: `_cachedCanvas`, `_cachedCtx`，避免 250ms+ selector
- **CSS 动画优先**: transform + will-change + cubic-bezier，不用 JS requestAnimationFrame
- **配置不硬编码**: 所有参数集中在 config.js

## 已踩过的坑
- mp-weixin `:class` 不支持方法调用 → 用 computed 属性
- `background` 渐变不支持 CSS transition → 用多个 spot 元素
- `swiper-item` 默认 `overflow: hidden` → 需 `!important` 覆盖
- `:key` 不支持复杂表达式 → 用纯 `idx`
- `await uni.request()` 返回 `[err, res]` 不是 `res` → 用 callback 转 Promise
- CSS `@keyframes transform` 与类 `transform` 冲突 → 方向偏移用 margin 代替
- 光斑 `filter: blur(200rpx+)` 需 `will-change: transform` 独立合成层
- `npm run dev:mp-weixin` 永远不会退出 → 必须 `run_in_background: true`

## 用户偏好
- KISS 原则：简化而非新增，三行代码优于一个抽象
- 暴露问题而非静默：console.warn 保留
- 中文注释/中文沟通为主
- 重视 UI 细节和视觉体验
- 先建规范再开发，API 文档精确到字段级别
- 后端 Michael 负责，与 Pangan Quant 共用腾讯云

## 产品哲学
- 娱乐优先非教育优先（用户会跳过教学模块）
- Tinder(滑动) + Duolingo(留存) + 跳一跳(轻量) 混合体
- 零门槛：右滑买/左滑卖，不需要金融术语
- 合规定位：投资"直觉测试"游戏，非投资建议，虚拟金币制

## Topic 索引
- 产品起源/愿景/关键转折 → `memory/topics/product-vision.md`
- 技术栈/架构/模块隔离决策 → `memory/topics/architecture-decisions.md`
- 视觉设计/色彩/动画/交互 → `memory/topics/ui-ux-patterns.md`
- 交易规则/股票池/仓位/计分 → `memory/topics/game-mechanics.md`
- Canvas缓存/手势优化/帧率 → `memory/topics/performance-patterns.md`
- Bug历史/踩坑/解决方案 → `memory/topics/debugging-history.md`
- API设计/Michael协作/实现状态 → `memory/topics/backend-api.md`
- 构建流程/微信DevTools/服务器 → `memory/topics/deployment-ops.md`
