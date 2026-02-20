# 盘感 Trading Instinct

微信小程序 · 游戏化交易直觉训练

用真实历史行情训练交易直觉。类 Tinder 滑动交互，左滑看跌、右滑看涨，结合 AI 分析反馈，每天 3 分钟提升投资盘感。

## 核心玩法

| 手势 | 动作 | 触发条件 |
|------|------|----------|
| 右滑 | 买入（做多/加仓） | 水平 >60px |
| 左滑 | 卖出（平多/做空） | 水平 >60px |
| 上滑 | 换股（卡片轮盘选择器） | 垂直 >100px |
| 下滑 | 跳过（推进 K线） | 垂直 >100px |
| 长按 600ms | 2X 重仓 | 按住 >600ms |
| 双指缩放 | 切换时间周期 | 张开/合拢 |

## 功能特性

- **58 只真实股票**: 28 美股 + 3 加密货币 + 15 A股 + 12 港股
- **6 种时间周期**: 1H / 1D / 1W / 1M / 1Y / ALL，双指缩放切换
- **双模式系统**: 新手面积图 + 真实蜡烛图
- **真实市场数据**: 美股/加密走 Massive API，A股/港股走东方财富 API
- **卡片轮盘选股器**: 滑动浏览、动态市场主题背景
- **K线 Canvas 实时渲染**: Canvas 2D API，手势操作流畅
- **AI 双层分析**: 快速本地规则 + DeepSeek 深度分析
- **金币经济系统**: 百分比仓位、整数股交易、手续费、破产重生
- **市场规则**: 美股/加密可做空，A股/港股禁止做空

## 技术栈

- **框架**: uni-app + Vue 2 (v2.6.14)
- **平台**: mp-weixin（微信小程序）
- **K线渲染**: Canvas 2D API + CSS 动画（transform + cubic-bezier）
- **数据源**:
  - Massive/Polygon API — 美股、加密货币（需 API Key）
  - 东方财富 HTTP API — A股、港股（免费，无需 Key）
- **AI**: DeepSeek API（本地规则降级兜底）
- **存储**: localStorage 持久化

## 项目结构

```
src/
├── pages/
│   ├── welcome/       # 登录/引导页
│   ├── index/         # 核心游戏页（K线 Canvas + 滑动交易 + 股票选择器）
│   ├── result/        # AI 分析结算页
│   └── ranking/       # 排行榜页（待后端接入）
├── utils/
│   ├── config.js      # 统一配置（API/游戏参数/股票池/周期）
│   ├── stockData.js   # K线数据获取 + 自动路由 + 归一化 + 缓存
│   └── aiAnalysis.js  # AI 分析（本地规则 + DeepSeek）
└── static/            # 静态资源
memory/                # Claude 跨会话记忆系统
CLAUDE.md              # 开发规范
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式（持续运行的 dev server）
npm run dev:mp-weixin

# 生产构建
npm run build:mp-weixin
```

构建完成后用微信开发者工具打开 `dist/dev/mp-weixin/`（dev）或 `dist/build/mp-weixin/`（build）。

> 开发阶段需在微信开发者工具中勾选"不校验合法域名"，或在 mp.weixin.qq.com 后台添加 `push2his.eastmoney.com` 到 request 合法域名。

## 小程序信息

- **AppID**: `wx08c5a364db7c3099`
- **框架**: uni-app + Vue 2

## 后端（规划中）

- API 规格文档: `260129_盘感后端API技术规格文档_Michael.md`
- 技术栈: Python FastAPI + MySQL + JWT
- 当前前端独立运行，后端待 Michael 实现
