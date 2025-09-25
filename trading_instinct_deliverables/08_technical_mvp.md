# 技术方案与 MVP 实施细节（面向单人开发者）

## 推荐栈（基于你熟悉 Python）
- 前端（微信小程序）：使用 **uni-app** 或 Taro（如果你愿意学习 Vue/React）
- 后端：**Python (FastAPI 或 Flask)** — 指标计算、切片生成、API
- 数据：Tiingo / Alpha Vantage / Twelve Data（先用免费或低价档并做本地缓存）
- AI：Claude（作为文本解释器），后端先计算指标并把 JSON 给 Claude

## 切片 JSON Schema（示例）
```json
{
  "id": "slice_0001",
  "symbol": "NVDA",
  "start_date": "2023-01-01",
  "end_date": "2024-01-01",
  "visible_until": "2023-06-30",
  "prices": [/* 收盘价数组 */],
  "indicators": {
    "ma5": [...],
    "ma20": [...],
    "rsi14": [...],
    "kdj": [...]
  },
  "market_state": "bull",
  "difficulty": "easy"
}
```

## API 设计（最小）
- `GET /api/next_slice` -> 返回一个已预生成的切片（包含指标至 visible_until）
- `POST /api/submit_guess` -> 提交用户的选择（symbol, slice_id, guess, confidence）
- `GET /api/reveal` -> 返回后续真实数据、分数、AI 解释文本（或 AI 解释可通过单独 endpoint 获取并缓存）

## 后端作业（异步）
- 批量抓取历史并生成切片（离线任务）
- 指标计算任务（RSI, MA, KDJ, volume_ma）
- 难度评分（根据历史人群表现或统计特征）

## 部署建议
- 小流量验证阶段可用轻量 VPS 或国内主机（腾讯云/阿里云）
- 使用缓存（Redis / 本地文件）减少第三方 API 请求
