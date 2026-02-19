# 盘感 Trading Instinct

基于 **uni-app** 的微信小程序，用真实历史行情训练交易直觉。类 Tinder 滑动交互，左滑看跌、右滑看涨，结合 AI 分析反馈，每天 3 分钟提升投资盘感。

## 核心玩法

- **右滑** 买入（做多/加仓）
- **左滑** 卖出（平多/做空）
- **上滑** 换股（打开股票选择器）
- **下滑** 跳过（推进 K 线）
- **长按** 2X 倍数加仓
- **双指缩放** 切换时间周期

## 功能特性

- 58 只真实股票：28 美股 + 3 加密货币 + 15 A股 + 12 港股
- 6 种时间周期：1D / 1W / 1M / 3M / 1Y / ALL
- 卡片轮盘选股器：滑动浏览、动态市场主题背景
- K 线 Canvas 实时渲染，手势操作流畅
- AI 双层分析：快速本地规则 + DeepSeek 深度分析
- 金币经济系统：百分比仓位、手续费、破产重生
- 市场规则：美股/加密可做空，A股/港股不可做空

## 技术栈

- **框架**: uni-app + Vue 2 (v2.6.14)
- **目标端**: mp-weixin（微信小程序）
- **UI/动效**: Canvas 2D + CSS 动画（transform + cubic-bezier）
- **数据**: Massive/Polygon API（Mock 降级）
- **AI**: DeepSeek API（本地规则降级）
- **存储**: uni.setStorageSync / getStorageSync

## 项目结构

```
trading_instinct/
├── src/
│   ├── pages/
│   │   ├── welcome/       # 登录/引导页
│   │   ├── index/         # 核心游戏页（K线 + 滑动交易）
│   │   ├── result/        # AI 分析结算页
│   │   └── ranking/       # 排行榜页
│   ├── utils/
│   │   ├── config.js      # 统一配置（API/游戏参数/股票池/周期）
│   │   ├── stockData.js   # K线数据获取、归一化、缓存
│   │   └── aiAnalysis.js  # AI 分析（本地规则 + DeepSeek）
│   ├── static/            # 静态资源
│   ├── App.vue
│   ├── main.js
│   └── pages.json
├── dist/build/mp-weixin/  # 构建产物（微信开发者工具打开此目录）
├── CLAUDE.md              # 开发规范
├── package.json
└── .gitignore
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev:mp-weixin

# 生产构建
npm run build:mp-weixin
```

构建完成后用微信开发者工具打开 `dist/dev/mp-weixin/`（dev）或 `dist/build/mp-weixin/`（build）。

## 小程序信息

- **AppID**: wx08c5a364db7c3099
- **框架**: uni-app + Vue 2
