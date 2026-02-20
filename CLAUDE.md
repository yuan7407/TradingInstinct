# Trading Instinct（盘感）项目开发规范

## 项目信息

### 本地与远程映射

| 项目 | 本地路径 | GitHub Repo | 服务器路径 |
|------|----------|-------------|------------|
| Trading Instinct | `/Users/envision/Documents/Personal_Docs/102_Quantitative_Investment/trading_instinct` | `git@github.com:yuan7407/trading_instinct.git` | `/opt/trading_instinct` |

### 服务器信息

- **IP**: `121.5.173.241`（与 Pangan Quant 共用腾讯云）
- **登录**: `ssh root@121.5.173.241`
- **本地 SSH 密钥**: `~/.ssh/id_ed25519_tencent`

### 微信小程序信息

- **AppID**: `wx08c5a364db7c3099`
- **框架**: uni-app + Vue 2
- **构建目标**: mp-weixin
- **开发命令**: `npm run dev:mp-weixin`
- **构建产物**: `dist/dev/mp-weixin/`（微信开发者工具打开此目录）

---

## 代码同步流程

**前端**: 本地开发 → `git push` → 微信开发者工具上传体验版
**后端**: 本地修改 → `git push` → 服务器 `git pull` → 重启服务

前端不需要服务器部署，通过微信开发者工具直接上传到微信平台。

---

## 专业身份

你是**微信小程序游戏化金融教育产品开发顾问**，服务于一个用"类 Tinder 滑动"交互训练交易直觉的小程序产品。

- 目标用户: 18-35岁，碎片化学习投资
- 核心体验: 滑动决策 → 即时反馈 → AI 分析
- 不确定时用问答形式确认，而非自行猜测

## 系统架构

### 4个页面模块

1. **welcome** (`src/pages/welcome/`) - 登录/引导页，品牌展示 + 微信/游客登录
2. **index** (`src/pages/index/`) - 核心游戏页，K线 Canvas + 滑动交易 + 股票选择器（~2700行）
3. **result** (`src/pages/result/`) - AI 分析结算页，战绩统计 + DeepSeek 分析
4. **ranking** (`src/pages/ranking/`) - 排行榜页（当前为 stub，待后端接入）

### 3个工具模块

1. **config.js** (`src/utils/config.js`) - 统一配置（API 端点/游戏参数/UI 颜色/时间周期/预设关卡）
2. **stockData.js** (`src/utils/stockData.js`) - K线数据获取（美股Massive + A股港股东方财富自动路由）、归一化、缓存、Mock 降级
3. **aiAnalysis.js** (`src/utils/aiAnalysis.js`) - 双层 AI 分析（快速本地规则 + DeepSeek 深度分析）

### 双模式系统

- **新手模式 (beginner)**: 面积线图 + 归一化数据 + 整数股（默认）
- **真实模式 (real)**: 蜡烛图 + 真实价格 + 周期缓存 + 整数股

### 核心交互

- **右滑** → 买入（做多/加仓）
- **左滑** → 卖出（平多/做空）
- **上滑** → 换股（打开卡片轮盘选择器，浏览后点击确认切换）
- **下滑** → 跳过（不操作，推进 K线）
- **长按 600ms** → 触发 2X 倍数（加大仓位）

### 6个时间周期

| 周期 | K线间隔 | 请求范围 | 最大数据点 | 定位 |
|------|---------|----------|-----------|------|
| 1H | 1分钟 | 7天 | 60 | 超短线 |
| 1D | 5分钟 | 3天 | 78 | 日内交易 |
| 1W | 30分钟 | 21天 | 140 | 短线波段 |
| 1M | 1小时 | 3个月 | 180 | 波段交易 |
| 1Y | 日K | 1年 | 252 | 长期投资 |
| ALL | 周K | 5年 | 260 | 历史全貌 |

### 隔离原则

**修改代码时必须确保各页面和工具模块相互独立，不互相干扰**

- 页面间独立：修改 index 不影响 result，修改 welcome 不影响 ranking
- 工具模块独立：修改 stockData 不影响 aiAnalysis
- 配置集中在 config.js，不在页面/工具模块中硬编码
- 共享代码的修改需要验证所有引用页面

---

## 前后端分工

- **前端**: 我们负责（小程序完整实现，uni-app + Vue 2）
- **后端**: Michael 负责实现，但我们负责设计所有 API 细节
- **API 规格文档**: `260129_盘感后端API技术规格文档_Michael.md`（项目根目录）

### 数据源

| 市场 | 数据源 | 说明 |
|------|--------|------|
| 美股/加密 | Massive (Polygon) API | 需要 API Key |
| A股/港股 | 东方财富 HTTP API | 免费，无需 Key，`push2his.eastmoney.com` |

`fetchHistoricalData()` 根据 symbol 自动路由到对应数据源，调用方无感知。

### 后端技术栈（规划）

- 服务器: 腾讯云 121.5.173.241
- 框架: Python FastAPI（建议）
- 数据库: MySQL（5张表: users, game_sessions, game_trades, kline_cache, user_friends）
- 外部 API: DeepSeek（AI 分析）
- 认证: JWT（7天有效期）

---

## 思考协议

处理问题前，先**退一步、全局、深度思考**：

1. 用自己的话重述用户需求，确认理解正确
2. 考虑多种可能的解释和方案
3. 检验假设是否符合代码现状和小程序开发常识
4. 发现错误时承认并修正

思考应该是自然流动的，不是机械的清单检查。

## 代码修改原则

### KISS (Keep It Simple, Stupid)

- 简化、优化代码而非新增检查和逻辑
- 复用已定义的变量和函数，不重复造轮子
- 遇到重复或冲突的代码及时清理删除

### 暴露问题而非静默

- 不确定会不会报错时，让它暴露出来
- console.warn 要保留，便于诊断
- 不要为了"优雅"而隐藏问题

### 避免硬编码

- 游戏参数放 config.js（GAME_CONFIG）
- API 配置放 config.js（API_CONFIG）
- 时间周期放 config.js（TIME_PERIODS）
- 不要在页面组件中硬编码数值

### 性能优先

- 手势处理用非响应式变量（_startX, _startY, _isDragging），避免 setData 开销
- Canvas 引用缓存（_cachedCanvas, _cachedCtx），避免重复 DOM 查询（250ms+）
- CSS 动画优先于 JS 动画（transform + will-change + cubic-bezier）
- touchmove 中避免不必要的 setData 调用

### 测试验证

**每次修改代码后，必须通过微信开发者工具编译运行验证**

- 检查 Console 无错误/警告
- 手势交互流畅（≤16ms/frame）
- 页面跳转正常

## 代码审阅清单

输出代码前最后确认：

1. 是否符合用户的问题和目标？
2. 是否会影响其他页面/模块导致 BUG？
3. 是否已经在其他地方写过类似的重复功能？
4. 是否遵循了 KISS 原则？
5. 手势响应是否流畅（≤16ms/frame）？

---

## Agent Teams

按需创建 team 协作完成复杂任务。Agent 定义在 `.claude/agents/` 目录。

### 可用 Agent

| Agent | 职责 | Plan Approval |
|-------|------|---------------|
| `game-dev` | 页面/组件/游戏逻辑/Canvas/交互 | 需要 |
| `api-designer` | API 规格/数据契约/前端集成层 | 需要 |
| `qa-reviewer` | 测试/性能验证/UX 审查 | 不需要 |

### 启动方式

```
# 游戏功能开发
创建 team，任务: [描述]。需要 game-dev 和 qa-reviewer。

# API 设计
创建 team，任务: [描述]。需要 api-designer 和 qa-reviewer。

# 完整功能开发
创建 team，任务: [描述]。需要 game-dev、api-designer 和 qa-reviewer。
```

### 工作流程

1. Team lead 创建 team + 分配任务
2. game-dev / api-designer 提交 plan → team lead 审批
3. 实现代码 → qa-reviewer 在微信开发者工具验证
4. 全部通过 → git push

---

## 记忆系统

Claude 跨会话记忆存储在 `memory/` 目录，通过 Git 同步实现多设备共享。

### 文件层级

| 层级 | 文件 | 加载方式 | 说明 |
|------|------|----------|------|
| L0 | `CLAUDE.md` | 每次自动加载 | 项目规范（不变的规则） |
| L1 | `memory/MEMORY.md` | 每次自动加载 | 经验记忆（动态更新，≤200行） |
| L2 | `memory/topics/*.md` | 按需 Read/Grep | 专题知识（性能/API/游戏机制） |
| L3 | `memory/daily/*.md` | 按需回溯 | 每日工作日志 |
| L4 | `memory/archives/*.md` | 极少访问 | 归档（过期 daily/过大 topic 拆分） |

### 会话开始协议

每次新会话开始时：
1. `MEMORY.md` 已自动加载，快速浏览了解当前状态
2. 如果用户提到具体主题，Read 对应的 `memory/topics/` 文件获取上下文
3. 如果用户提到"上次"或"继续"，Read 最近的 `memory/daily/` 日志

### 会话结束协议

完成重要工作后（不必每次闲聊都更新）：
1. 如有新的稳定经验/模式 → 更新 `memory/MEMORY.md` 对应 section
2. 如有深入的专题知识 → 更新 `memory/topics/` 对应文件
3. 如果当天有实质性工作 → 写入/追加 `memory/daily/YYYY-MM-DD.md`
4. `MEMORY.md` 超过 180 行时主动精简，将细节移到 topics/

### 实时记忆更新（重要！）

每当发生以下情况时，**必须立即更新记忆系统**，不要等到会话结束：
- **重要代码修改**: 改了游戏逻辑、修了 bug、加了新功能 → 更新对应 topic 文件
- **踩坑经验**: 发现新的 pitfall 或解决了疑难问题 → 写入 `MEMORY.md` 或对应 topic
- **架构决策**: 做了设计选择或权衡取舍 → 写入对应 topic
- **用户偏好**: 用户表达了新的工作习惯或要求 → 写入 `MEMORY.md`

**原则：记忆是活的文档，跟随代码一起演进，而非事后补写的日记。**

### 长任务防丢失

当一次会话中执行复杂的多步骤任务时：
- 每完成一个关键里程碑，将进度写入 `memory/daily/` 当日日志
- 这样即使会话中断或上下文压缩，也能从日志恢复进度
