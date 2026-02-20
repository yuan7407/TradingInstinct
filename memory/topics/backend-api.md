# 后端 API 设计与协作

## 当前状态
- **API 规格文档已完成**: `260129_盘感后端API技术规格文档_Michael.md`（项目根目录）
- **后端负责人**: Michael
- **实现进度**: 尚未开始
- **分工**: 前端我们做 / 后端 Michael 做 / API 设计我们负责

## 技术栈规划
- **框架**: Python FastAPI（建议）
- **数据库**: MySQL
- **认证**: JWT（7天有效期）
- **服务器**: 腾讯云 121.5.173.241（与 Pangan Quant 共用）
- **外部 API**: Twelve Data（K线数据）+ DeepSeek（AI分析）

## 数据库设计（5张表）

### users
- 用户基本信息 + 微信 OpenID
- 金币余额、等级、连续登录天数

### game_sessions
- 每局游戏记录（股票/时间周期/最终资产/收益率）
- 关联 user_id

### game_trades
- 每次交易明细（买/卖/做空/平仓/价格/数量/手续费）
- 关联 session_id

### kline_cache
- K线数据服务端缓存
- 避免重复调用 Twelve Data API（有限额）

### user_friends
- 微信好友关系（用于好友排行榜）

## 核心 API 端点

### 认证
- `POST /api/auth/login` — 微信登录（code→openid→JWT）
- `POST /api/auth/guest` — 游客模式

### 游戏
- `POST /api/game/start` — 开始一局（返回股票+K线数据）
- `POST /api/game/trade` — 提交交易决策
- `POST /api/game/finish` — 结束一局（触发AI分析）

### 排行榜
- `GET /api/ranking/global` — 全球排行
- `GET /api/ranking/friends` — 好友排行

### 日常
- `POST /api/daily/reward` — 每日签到奖励
- `GET /api/daily/challenge` — 每日挑战关卡

## 前端当前数据流（无后端状态）
1. index.vue 直接调用 stockData.js 获取 K线数据
2. K线来源: `fetchHistoricalData()` 自动路由
   - 美股/加密 → Massive/Polygon API（前端直连）
   - A股/港股 → 东方财富 HTTP API（免费，无需 Key，`push2his.eastmoney.com`）
   - 失败时 → Mock 数据降级
3. AI分析: 前端直连 DeepSeek API
4. 用户数据: 全部存 localStorage（无持久化/无同步）

## 后端接入后的变化
1. K线数据 → 后端获取+缓存（减少 API 额度消耗）
2. AI分析 → 后端调用 DeepSeek（API Key 安全）
3. 用户数据 → 后端 MySQL（持久化/跨设备同步）
4. 排行榜 → 后端聚合计算（ranking 页面激活）
