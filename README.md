# 盘感 · Trading Instinct

基于 **uni-app** 的微信小程序，用历史真实行情训练「短线盘感」。策略强调趋势判断，结合均线、MACD、RSI 与成交量等指标，支持回测与实盘交互式练习。

左滑看跌，右滑看涨真实历史，真实股票每天3分钟，训练投资直觉。
🎯 使用全球股市真实历史数据
💰 累积金币，解锁神秘关卡
📊 大咖和AI分析你的决策对错原因
🏆 与微信好友和全球玩家一起竞技排名
📱 像刷抖音一样简单，像交易员一样思考

## 功能
- 欢迎页动画与登录（微信登录 / 游客体验）
- 练习页（左右滑动做多做空，分步决策）
- 结果页与积分反馈
- 排行榜
- 本地存储用户信息与游客模式

## 技术栈
- 框架：`uni-app`（Vue 2/3 以项目实际为准）
- 目标端：`mp-weixin`
- UI与动效：`<canvas>`、CSS 动画
- 状态与存储：`uni.* API`

## 目录结构
    trading_instinct/
    ├─ src/ # 源码（开发目录）
    │ ├─ pages/
    │ │ ├─ welcome/welcome.vue
    │ │ ├─ index/index.vue
    │ │ ├─ result/result.vue
    │ │ └─ ranking/ranking.vue
    │ ├─ utils/aiAnalysis.js
    │ ├─ App.vue
    │ ├─ main.js
    │ └─ pages.json # 页面与窗口配置（生成 app.json 的来源）
    ├─ dist/dev/mp-weixin/ # 微信小程序运行目录（编译产物）
    ├─ package.json
    ├─ README.md
    └─ .gitignore
