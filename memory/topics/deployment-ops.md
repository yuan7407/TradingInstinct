# 部署与运维

## 前端构建

### 开发命令
```bash
npm run dev:mp-weixin
```
- 产物目录: `dist/dev/mp-weixin/`
- 微信开发者工具打开此目录（**不是源码目录**）

### 微信小程序信息
- AppID: `wx08c5a364db7c3099`
- 框架: uni-app + Vue 2
- 构建目标: mp-weixin

### 发布流程
1. 本地开发 + 微信 DevTools 预览
2. `git push` 到 GitHub
3. 微信开发者工具 → 上传 → 体验版
4. 微信后台审核 → 正式版

## 服务器信息

### 腾讯云
- IP: `121.5.173.241`
- 登录: `ssh root@121.5.173.241`
- SSH 密钥: `~/.ssh/id_ed25519_tencent`
- 共用: 与 Pangan Quant 共用同一台服务器

### 后端部署（规划）
- 服务器路径: `/opt/trading_instinct`
- 同步: `git push` → 服务器 `git pull` → 重启 FastAPI 服务

## Git 仓库

### 远程仓库
- URL: `git@github.com:yuan7407/trading_instinct.git`
- 分支: main

### 本地路径
- Mac: `/Users/envision/Documents/Personal_Docs/102_Quantitative_Investment/trading_instinct`

### 代码同步
- **前端**: 本地 → git push → 微信 DevTools 上传（不需要服务器部署）
- **后端**: 本地 → git push → 服务器 git pull → 重启服务

## 依赖管理

### 已知问题
- Puppeteer: `PUPPETEER_SKIP_DOWNLOAD=true` 避免下载 Chromium
- url-loader: v4 与 v5 可能冲突，使用最小依赖集

### 环境变量
- `VUE_APP_DEEPSEEK_KEY`: DeepSeek API Key
- `VUE_APP_MASSIVE_KEY`: Massive/Polygon API Key
- 生产环境应通过后端代理，避免 Key 暴露在前端

## 微信开发者工具注意事项
- 必须打开 `dist/dev/mp-weixin/` 不是 `src/`
- 开启"不校验合法域名"（开发阶段调用外部 API）
- Console 面板检查错误/警告
- Performance 面板验证帧率

## 域名白名单（上线时）
微信小程序后台 → 开发管理 → 开发设置 → 服务器域名 → request合法域名:
- `https://api.massive.com`（美股/加密 K线）
- `https://push2his.eastmoney.com`（A股/港股 K线）
- `https://api.deepseek.com`（AI 分析）
