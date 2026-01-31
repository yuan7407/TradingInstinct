# 盘感后端API技术规格文档

# 飞书 跟 后端

> 本文档直接给后端开发人员，包含所有技术细节。

---

## 1. 数据库表结构

### 1.1 用户表 `users`

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | BIGINT | Y | AUTO | 主键 |
| openid | VARCHAR(64) | N | NULL | 微信openid，游客为空 |
| unionid | VARCHAR(64) | N | NULL | 微信unionid，用于好友关系 |
| device_id | VARCHAR(64) | Y | - | 设备唯一标识（游客用此识别） |
| nickname | VARCHAR(50) | Y | '玩家xxx' | 昵称 |
| avatar_url | VARCHAR(255) | N | NULL | 头像URL |
| coins | BIGINT | Y | 0 | 当前金币余额 |
| is_guest | TINYINT(1) | Y | 1 | 1=游客，0=微信用户 |
| total_games | INT | Y | 0 | 总游戏局数 |
| win_games | INT | Y | 0 | 胜利局数（盈利的局） |
| total_profit | DECIMAL(15,2) | Y | 0.00 | 累计盈亏金额 |
| total_return_rate | DECIMAL(10,4) | Y | 0.0000 | 累计收益率（百分比，如5.23表示5.23%） |
| last_daily_reward | DATE | N | NULL | 上次领取每日奖励的日期 |
| created_at | DATETIME | Y | NOW | 注册时间 |
| updated_at | DATETIME | Y | NOW | 最后更新 |

**索引：**
- UNIQUE INDEX `idx_openid` (openid) - openid不为空时唯一
- UNIQUE INDEX `idx_device_id` (device_id)
- INDEX `idx_total_return_rate` (total_return_rate DESC) - 收益率排行
- INDEX `idx_coins` (coins DESC) - 金币排行
- INDEX `idx_win_rate` (win_games, total_games) - 胜率排行

---

### 1.2 游戏局记录表 `game_sessions`

每只股票从开始到结束算一局。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | BIGINT | Y | 主键 |
| user_id | BIGINT | Y | 外键→users.id |
| stock_symbol | VARCHAR(20) | Y | 股票代码，如"NVDA" |
| stock_name | VARCHAR(50) | Y | 股票名称，如"英伟达" |
| time_period | VARCHAR(10) | Y | 时间周期：1D/1W/1M/3M/1Y/ALL |
| kline_data | LONGTEXT | N | 本局使用的K线数据JSON（用于游戏恢复） |
| start_coins | BIGINT | Y | 本局开始时金币 |
| end_coins | BIGINT | Y | 本局结束时金币 |
| profit_loss | DECIMAL(15,2) | Y | 本局盈亏金额 |
| return_rate | DECIMAL(10,4) | Y | 本局收益率% |
| is_win | TINYINT(1) | Y | 1=盈利，0=亏损或平 |
| trade_count | INT | Y | 交易次数 |
| ai_analysis | TEXT | N | AI分析文本 |
| status | ENUM | Y | 'playing'/'completed'/'abandoned' |
| created_at | DATETIME | Y | 开始时间 |
| completed_at | DATETIME | N | 结束时间 |

**索引：**
- INDEX `idx_user_id` (user_id)
- INDEX `idx_user_status` (user_id, status)
- INDEX `idx_created_at` (created_at DESC)

---

### 1.3 交易明细表 `game_trades`

每局游戏的每笔交易记录。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | BIGINT | Y | 主键 |
| session_id | BIGINT | Y | 外键→game_sessions.id |
| user_id | BIGINT | Y | 外键→users.id（冗余便于查询） |
| type | ENUM | Y | 'buy'/'sell'/'short'/'cover' |
| price | DECIMAL(15,4) | Y | 成交价格 |
| shares | DECIMAL(15,4) | Y | 成交数量 |
| amount | DECIMAL(15,2) | Y | 交易金额 |
| multiplier | TINYINT | Y | 倍数：1或2 |
| profit | DECIMAL(15,2) | N | 平仓时的盈亏（仅sell/cover时有） |
| index | INT | Y | 对应K线位置（0-999） |
| created_at | DATETIME | Y | 交易时间 |

**索引：**
- INDEX `idx_session_id` (session_id)
- INDEX `idx_user_id` (user_id)

---

### 1.4 K线缓存表 `kline_cache`

缓存从Twelve Data获取的K线数据，减少API调用。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | BIGINT | Y | 主键 |
| symbol | VARCHAR(20) | Y | 股票代码 |
| timespan | VARCHAR(10) | Y | 'minute'/'hour'/'day'/'week' |
| multiplier | INT | Y | 1/5/30等 |
| start_date | DATE | Y | 数据起始日期 |
| end_date | DATE | Y | 数据结束日期 |
| kline_data | LONGTEXT | Y | JSON格式K线数据数组 |
| data_count | INT | Y | K线条数 |
| created_at | DATETIME | Y | 缓存时间 |
| expires_at | DATETIME | Y | 过期时间（建议30天） |

**索引：**
- UNIQUE INDEX `idx_symbol_period` (symbol, timespan, multiplier, start_date, end_date)

---

### 1.5 微信好友关系表 `user_friends`

用于好友排行榜。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | BIGINT | Y | 主键 |
| user_id | BIGINT | Y | 用户ID |
| friend_openid | VARCHAR(64) | Y | 好友的openid |
| created_at | DATETIME | Y | 建立时间 |

**索引：**
- UNIQUE INDEX `idx_user_friend` (user_id, friend_openid)
- INDEX `idx_user_id` (user_id)

---

## 2. API接口详细规格

### 2.1 用户模块

#### POST /v1/api/user/login

微信登录或游客登录。

**请求体：**
```json
{
  "login_type": "wechat",           // "wechat" 或 "guest"
  "code": "0a3Xxx...",              // 微信登录code（login_type=wechat时必填）
  "device_id": "xxxx-xxxx-xxxx",    // 设备唯一标识（必填）
  "nickname": "玩家昵称",            // 可选，游客时可传
  "avatar_url": "https://..."       // 可选
}
```

**后端逻辑：**
1. 如果`login_type=wechat`：
   - 用code调用微信接口换取openid/unionid
   - 根据openid查找或创建用户
2. 如果`login_type=guest`：
   - 根据device_id查找或创建用户
3. 新用户初始金币 = 0（需要调用开始游戏接口时初始化）
4. 返回JWT token 
//每个接口要带上token

**响应：**
```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGc...",          // JWT，有效期7天
    "user": {
      "id": 12345,
      "nickname": "玩家12345",
      "avatar_url": "https://...",
      "coins": 15000,
      "is_guest": false,
      "total_games": 10,
      "win_games": 6,
      "total_profit": 5680.50,
      "total_return_rate": 12.35,   // 百分比
      "win_rate": 60.0,             // 计算值：win_games/total_games*100
      "can_claim_daily": true       // 今日是否可领取每日奖励
    }
  }
}
```

---

#### GET /api/user/profile

获取用户信息（需要token）。

**响应：** 同上面的user对象。

---

#### POST /api/user/daily/reward

领取每日奖励金币。

**后端逻辑：**
1. 检查`last_daily_reward`是否是今天
2. 如果已领取，返回错误
3. 随机生成5000-20000金币
4. 更新用户金币和`last_daily_reward`

**响应：**
```json
{
  "code": 0,
  "data": {
    "reward_coins": 12500,          // 本次奖励金币数
    "total_coins": 27500            // 奖励后总金币
  }
}
```

**错误响应（已领取）：**
```json
{
  "code": 40001,
  "message": "今日已领取"
}
```

---

#### POST /api/user/guest/to/wechat

游客绑定微信账号（合并数据）。

**请求体：**
```json
{
  "code": "0a3Xxx..."               // 微信登录code
}
```

**后端逻辑：**
1. 用code换取openid
2. 检查openid是否已有账号
3. 如果有，返回错误"该微信已绑定其他账号"
4. 如果没有，更新当前用户的openid，设置is_guest=0

---

### 2.2 游戏核心模块

#### POST /api/game/start

开始新一局游戏，获取K线数据。

**请求体：**
```json
{
  "time_period": "3M",              // 可选，默认"3M"。支持1D/1W/1M/3M/1Y/ALL
  "stock_symbol": "NVDA"            // 可选，不传则随机选股
}
```

**后端逻辑：**
1. 检查用户是否有进行中的游戏（status='playing'）：
   - 有且 `time_period` 相同：返回该游戏数据（含存储的K线数据）
   - 有但 `time_period` 不同：返回错误码 40007 "请先结束当前游戏再切换周期"
   - 无进行中游戏：开始新游戏
2. 根据time_period确定Twelve Data调用参数：
   ```
   1D: multiplier=5, timespan=minute, 范围=1天
   1W: multiplier=30, timespan=minute, 范围=7天
   1M: multiplier=1, timespan=hour, 范围=1个月
   3M: multiplier=1, timespan=day, 范围=3个月
   1Y: multiplier=1, timespan=day, 范围=1年
   ALL: multiplier=1, timespan=week, 范围=5年
   ```
3. 优先从kline_cache表获取，无缓存则调用Twelve Data并缓存
4. 从完整K线中随机截取数据（尽可能多，最多1000条）
5. **股价归一化**（详见下方说明）
6. 如果是新用户首次游戏，初始化金币 = 随机10000 - 30000
7. 创建game_session记录，status='playing'
8. 返回归一化后的K线数据

**股价归一化说明：**

归一化处理流程：
1. 对截取的1000条K线，遍历找出最低价（所有low中的最小值）和最高价（所有high中的最大值）
2. 设定目标范围：最低50，最高300
3. 计算缩放比例：scale = (300 - 50) / (最高价 - 最低价)
4. 对每条K线的 open/high/low/close 四个价格字段做转换：
   - 新价格 = (原价格 - 最低价) × scale + 50
5. volume（成交量）不做处理，保持原值
6. 转换后的价格保留2位小数

示例：
- 原始股票价格数据：最低价 800，最高价 1000
- 某条K线：open=850, high=880, low=840, close=870
- scale = (300-50) / (1000-800) = 1.25
- 转换后：open=112.5, high=150, low=100, close=137.5

**响应：**
```json
{
  "code": 0,
  "data": {
    "session_id": 98765,
    "stock_info": {
      "symbol": "NVDA",
      "name": "英伟达"
    },
    "time_period": "3M",
    "kline_data": [                  // 1000条K线
      {
        "index": 0,
        "date": "2023-01-03",
        "open": 125.50,
        "high": 128.30,
        "low": 124.80,
        "close": 127.20,
        "volume": 12500000
      },
      // ... 尽可能多，最多1000条
    ],
    "user_coins": 35000,             // 当前金币
    "is_new_user": true              // 是否首次游戏（前端可显示教程）
  }
}
```

---

#### POST /api/game/trade

提交一笔交易决策。

**请求体：**
```json
{
  "session_id": 98765,
  "type": "buy",              // buy/sell/short/cover
  "price": 127.20,                  // 成交价格
  "shares": 7.86,                   // 成交数量
  "amount": 1000,                   // 交易金额
  "multiplier": 1,                  // 1或2（重仓）
  "profit": null,                   // 平仓时的盈亏（sell/cover时传）
  "index": 25                 // K线位置
}
```

**后端逻辑：**
1. 验证session_id属于当前用户且status='playing'
2. 插入game_trades记录
3. 返回确认

**响应：**
```json
{
  "code": 0,
  "data": {
    "trade_id": 123456
  }
}
```

---

#### POST /api/game/end

结束当前游戏局，计算统计并触发AI分析。

**请求体：**
```json
{
  "session_id": 98765,
  "end_coins": 42500,               // 结束时金币
  "profit_loss": 7500,              // 本局盈亏
  "return_rate": 21.43,             // 本局收益率%
  "is_win": true,                   // 是否盈利
  "trade_count": 8,                 // 交易次数
  "need_ai_analysis": true,         // 是否需要AI分析
  "analysis_context": {             // AI分析上下文（need_ai_analysis=true时必填）
    "decisions_summary": "买入5次，卖出3次",
    "max_drawdown": 8.5,
    "win_rate": 62.5,
    "final_return": 21.43
  }
}
```

**后端逻辑：**
1. 更新game_sessions：end_coins, profit_loss, return_rate, is_win, trade_count, status='completed', completed_at
2. 更新users表统计数据：
   - coins = end_coins
   - total_games += 1
   - win_games += is_win ? 1 : 0
   - total_profit += profit_loss
   - 重新计算total_return_rate
3. 如果need_ai_analysis=true，调用DeepSeek生成分析
4. 返回结果

**响应：**
```json
{
  "code": 0,
  "data": {
    "session_id": 98765,
    "ai_analysis": "本次交易整体表现优秀。你在上涨趋势中及时建仓，并在高点附近止盈，展现了良好的趋势判断能力。建议：可以适当使用2倍仓位在确定性高的机会上放大收益。",
    "updated_stats": {
      "coins": 42500,
      "total_games": 11,
      "win_games": 7,
      "total_profit": 13180.50,
      "total_return_rate": 15.23,
      "win_rate": 63.64
    }
  }
}
```

---

#### POST /api/game/abandon

放弃当前游戏局（不计入统计）。

**请求体：**
```json
{
  "session_id": 98765
}
```

**后端逻辑：**
1. 更新session status='abandoned'
2. 不更新用户统计数据

---

#### GET /api/game/history

获取历史游戏记录。

**请求参数：**
```
?page=1&page_size=20
```

**响应：**
```json
{
  "code": 0,
  "data": {
    "total": 50,
    "page": 1,
    "page_size": 20,
    "list": [
      {
        "session_id": 98765,
        "stock_symbol": "NVDA",
        "stock_name": "英伟达",
        "time_period": "3M",
        "profit_loss": 7500,
        "return_rate": 21.43,
        "is_win": true,
        "trade_count": 8,
        "created_at": "2025-01-28 14:30:00",
        "completed_at": "2025-01-28 14:45:00"
      }
      // ...
    ]
  }
}
```

---

#### GET /api/game/history/:session_id/trades

获取某局游戏的交易明细。

**响应：**
```json
{
  "code": 0,
  "data": {
    "session_info": {
      "stock_symbol": "NVDA",
      "stock_name": "英伟达",
      "start_coins": 35000,
      "end_coins": 42500,
      "ai_analysis": "..."
    },
    "trades": [
      {
        "type": "buy",
        "price": 127.20,
        "shares": 7.86,
        "amount": 1000,
        "multiplier": 1,
        "profit": null,
        "index": 25,
        "created_at": "2025-01-28 14:32:15"
      }
      // ...
    ]
  }
}
```

---

### 2.3 K线数据模块

#### GET /api/kline/random

获取随机K线数据（供前端单独调用，不开启游戏局）。

**请求参数：**
```
?time_period=3M&stock_symbol=NVDA  // 都是可选
```

**响应：** 同 /api/game/start 中的 kline_data 部分。

---

#### GET /api/kline/stocks

获取支持的股票列表。

**响应：**
```json
{
  "code": 0,
  "data": {
    "stocks": [
      {"symbol": "NVDA", "name": "英伟达"},
      {"symbol": "AAPL", "name": "苹果"},
      {"symbol": "TSLA", "name": "特斯拉"},
      {"symbol": "GOOGL", "name": "谷歌"},
      {"symbol": "AMZN", "name": "亚马逊"},
      {"symbol": "MSFT", "name": "微软"},
      {"symbol": "META", "name": "Meta"},
      {"symbol": "AMD", "name": "AMD"},
      {"symbol": "NFLX", "name": "奈飞"},
      {"symbol": "DIS", "name": "迪士尼"},
      {"symbol": "BA", "name": "波音"},
      {"symbol": "JPM", "name": "摩根大通"},
      {"symbol": "V", "name": "Visa"},
      {"symbol": "BABA", "name": "阿里巴巴"}
    ]
  }
}
```

---

### 2.4 AI分析模块

**前端有两处AI介入，处理方式不同：**

| AI功能 | 触发时机 | 处理位置 | 说明 |
|--------|----------|----------|------|
| 快速建议 | 每次滑动决策后 | **前端本地** | 纯规则匹配，不调API，响应<10ms |
| 深度分析 | 游戏结束/破产时 | **后端代理** | 调用DeepSeek，需要保护API Key |


**深度分析（后端处理）：**

#### POST /api/ai/analyze

游戏结束时的AI深度分析接口（流式返回）。

**请求体：**
```json
{
  "session_id": 98765,              // 可选，关联游戏局
  "context": {
    "stock_symbol": "NVDA",
    "stock_name": "英伟达",
    "trade_count": 8,
    "total_return": 21.43,
    "win_rate": 62.5,
    "max_drawdown": 8.5,
    "decisions_summary": "买入5次(含1次重仓)，卖出3次"
  }
}
```

**后端逻辑：**
1. 构造DeepSeek prompt：

**System Prompt：**
```
你是「盘感」App的AI交易教练。盘感是一款通过模拟真实K线走势训练用户交易直觉的小程序，帮助用户在无风险环境中提升买卖时机判断能力。

请用100-150字分析用户的交易表现，并结合这只股票的公司背景、行业地位、历史表现特点，给出专业、易懂的操作建议。

要求：
1. 语言简洁专业，避免空话套话
2. 指出1-2个做得好的地方（如有）
3. 给出1-2条具体可执行的改进建议
4. 结合该股票特性给出针对性建议（如波动性、趋势性等）
```

**User Message：**
```
股票：{stock_name}（{stock_symbol}）
交易次数：{trade_count}
总收益率：{total_return}%
胜率：{win_rate}%
最大回撤：{max_drawdown}%

请分析我的交易表现并给出建议。
```

2. 调用DeepSeek API（流式）
3. 返回SSE流

**响应（SSE流式）：**
```
data: {"content": "本次"}
data: {"content": "交易"}
data: {"content": "表现"}
...
data: {"content": "[DONE]"}
```

---

### 2.5 排行榜模块

#### GET /api/rank/global

获取全球排行榜（三个榜单）。

**请求参数：**
```
?type=return_rate    // return_rate(收益率榜) / coins(金币榜) / win_rate(胜率榜)
&limit=10            // 默认10
```

**后端逻辑：**
1. 根据type查询对应排行：
   - return_rate: ORDER BY total_return_rate DESC
   - coins: ORDER BY coins DESC
   - win_rate: ORDER BY (win_games/total_games) DESC, total_games DESC
2. 同时查询当前用户的排名
3. **无最低游戏局数要求**，用户随时可查看排行榜

**响应：**
```json
{
  "code": 0,
  "data": {
    "type": "return_rate",
    "list": [
      {
        "rank": 1,
        "user_id": 100,
        "nickname": "股神小王",
        "avatar_url": "https://...",
        "value": 156.78,            // 收益率%
        "total_games": 45
      },
      // ... 共10条
    ],
    "my_rank": {
      "rank": 23,                   // 我的排名
      "value": 15.23,
      "total_games": 11
    }
  }
}
```

---

#### GET /api/rank/friends

获取好友排行榜（需要微信授权）。

**请求参数：**
```
?type=return_rate
```

**后端逻辑：**
1. 根据user_friends表获取好友列表
2. 查询好友的排名数据
3. 无最低游戏局数要求

**响应：** 格式同全球排行榜。

---

#### POST /api/rank/friends/sync

同步微信好友关系。

**请求体：**
```json
{
  "friend_openids": ["oXXX1...", "oXXX2...", "oXXX3..."]
}
```

**说明：** 前端通过微信开放数据域获取好友openid列表，上报给后端。

---

## 3. 外部API集成规格

### 3.1 Twelve Data（K线数据）

**官方文档：** https://twelvedata.com/docs

**调用示例：**
```
GET https://api.twelvedata.com/time_series?symbol=NVDA&interval=1day&start_date=2023-01-01&end_date=2024-01-01&apikey=YOUR_KEY
```

**参数映射：**
| 前端time_period | interval | 时间范围 |
|----------------|----------|---------|
| 1D | 5min | 1天 |
| 1W | 30min | 7天 |
| 1M | 1h | 1个月 |
| 3M | 1day | 3个月 |
| 1Y | 1day | 1年 |
| ALL | 1week | 5年 |

**响应解析：**
```json
{
  "values": [
    {
      "datetime": "2023-01-03",
      "open": "125.50",
      "high": "128.30",
      "low": "124.80",
      "close": "127.20",
      "volume": "12500000"
    }
  ]
}
```

**限制与策略：**
- 免费版：每分钟8次，每天800次
- 缓存策略：缓存30天，命中缓存时不调用API
- 超限处理：返回Mock数据（模拟前端假数据，随机生成）

---

### 3.2 DeepSeek（AI分析）
YOUR_KEY = JWT 
HTTP请求是个无状态的

**官方文档：** https://api-docs.deepseek.com/

**调用示例：**
```bash
curl https://api.deepseek.com/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [
      {"role": "system", "content": "你是专业的量化交易分析师..."},
      {"role": "user", "content": "分析以下交易..."}
    ],
    "stream": true,
    "max_tokens": 200,
    "temperature": 0.7
  }'
```

**流式响应处理：**
```
data: {"choices":[{"delta":{"content":"本次"}}]}
data: {"choices":[{"delta":{"content":"交易"}}]}
...
data: [DONE]
```

**超时与降级：**
- 超时时间：10秒
- 降级策略：返回预设的通用分析文本

---

## 4. 认证与安全

### 4.1 JWT Token规格

**生成：**
```json
{
  "user_id": 12345,
  "openid": "oXXXX...",
  "is_guest": false,
  "iat": 1706428800,
  "exp": 1707033600       // 7天后过期
}
```

**使用：**
- 请求头：`Authorization: Bearer {token}`
- 除登录接口外，所有接口都需要token

### 4.2 接口限流

| 接口类型 | 限制 |
|---------|------|
| 登录接口 | 每设备每分钟5次 |
| 普通接口 | 每用户每秒10次 |
| AI分析接口 | 每用户每分钟10次 |

### 4.3 敏感配置

以下配置必须用环境变量，不能硬编码：
- `TWELVE_DATA_API_KEY`
- `DEEPSEEK_API_KEY`
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `JWT_SECRET`
- 数据库密码

---

## 5. 数据流示意图

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端（微信小程序）                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        后端 API 服务                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  用户模块    │  │  游戏模块    │  │  排行榜模块  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      数据库                            ││
│  │  users | game_sessions | game_trades | kline_cache | ...    ││
│  └─────────────────────────────────────────────────────────────┘│
│                          │                                       │
└─────────────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                                 ▼
┌─────────────────┐                ┌─────────────────┐
│   Twelve Data   │                │    DeepSeek     │
│   (K线数据)      │                │   (AI分析)       │
└─────────────────┘                └─────────────────┘
```

---

## 6. 前端调用示例

### 6.1 完整游戏流程

```javascript
// 1. 登录
const loginRes = await request.post('/api/user/login', {
  login_type: 'wechat',
  code: wxCode,
  device_id: deviceId
})
const token = loginRes.data.token

// 2. 领取每日奖励（如果可以）
if (loginRes.data.user.can_claim_daily) {
  const rewardRes = await request.post('/api/user/daily-reward')
  // 前端播放转盘动画，最终停在 rewardRes.data.reward_coins
}

// 3. 开始游戏
const gameRes = await request.post('/api/game/start', {
  time_period: '3M'
})
const sessionId = gameRes.data.session_id
const klineData = gameRes.data.kline_data

// 4. 用户每次交易决策
await request.post('/api/game/trade', {
  session_id: sessionId,
  type: 'buy',
  price: 127.20,
  shares: 7.86,
  amount: 1000,
  multiplier: 1,
  index: 25
})

// 5. 游戏结束，获取AI分析
const endRes = await request.post('/api/game/end', {
  session_id: sessionId,
  end_coins: 42500,
  profit_loss: 7500,
  return_rate: 21.43,
  is_win: true,
  trade_count: 8,
  need_ai_analysis: true,
  analysis_context: {...}
})
```

### 6.2 排行榜调用

```javascript
// 获取收益率全球榜
const rankRes = await request.get('/api/rank/global?type=return_rate')

// 数据结构
// rankRes.data.list = [前10名]
// rankRes.data.my_rank = {rank: 23, value: 15.23}

// 前端渲染11行：
// - 如果my_rank.rank <= 10，显示前10名（我在其中高亮）
// - 如果my_rank.rank > 10，显示前10名 + 第11行显示我的排名
```

---

## 7. 错误码定义

| 错误码 | 说明 |
|-------|------|
| 0 | 成功 |
| 40001 | 今日已领取每日奖励 |
| 40002 | 金币不足 |
| 40003 | 游戏局不存在或已结束 |
| 40004 | 微信code无效 |
| 40005 | 该微信已绑定其他账号 |
| 40006 | 参数错误 |
| 40007 | 请先结束当前游戏再切换周期 |
| 40101 | token无效或过期 |
| 40102 | 请求频率超限 |
| 50001 | K线数据获取失败 |
| 50002 | AI分析服务不可用 |
| 50003 | 服务器内部错误 |

---

## 8. 性能与部署要求

### 8.1 预估负载

| 阶段 | 日活 | 峰值并发 | 日API调用 |
|-----|------|---------|----------|
| MVP | 100-500 | 20-50 | ~5000 |
| 增长期 | 1000-5000 | 100-200 | ~50000 |

### 8.2 响应时间要求

| 接口类型 | 目标响应时间 |
|---------|-------------|
| 用户登录 | < 500ms |
| 开始游戏（缓存命中） | < 200ms |
| 开始游戏（调用Twelve Data） | < 2s |
| 提交交易 | < 100ms |
| 排行榜查询 | < 300ms |
| AI分析（首字节） | < 1s |

### 8.3 服务器环境

- 阿里云轻量应用服务器 2核2G
- Ubuntu 24
- Nginx反向代理 + SSL
- 语言框架、数据库由后端自行选择

---

## 9. 需要后端提供的信息

完成开发后，请提供：

1. **API基础URL**：`https://api.xxx.com`
2. **微信小程序服务器域名配置**：需要在微信公众平台配置的域名
3. **接口文档**：如有调整，请更新
4. **测试账号**：用于前端联调

---

## 附录：Mock数据生成逻辑（前端模拟的假数据）

当Twelve Data不可用时，后端需要生成Mock K线：

```javascript
function generateMockKline(count = 1000) {
  const data = []
  let basePrice = 100 + Math.random() * 100  // 100-200之间
  const trend = Math.random() > 0.5 ? 0.3 : -0.3  // 50%概率上涨/下跌

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5 + trend / 10) * 4
    const open = basePrice
    basePrice = Math.max(50, Math.min(300, basePrice * (1 + change / 100)))
    const close = basePrice

    const high = Math.max(open, close) * (1 + Math.random() * 0.015)
    const low = Math.min(open, close) * (1 - Math.random() * 0.015)

    data.push({
      index: i,
      date: `Day ${i + 1}`,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(1000000 + Math.random() * 10000000)
    })
  }
  return data
}
```

---

## 附录B：需求确认Q&A记录

以下是需求Q&A，供参考：

### Q1: K线数据怎么处理？
**A:** 后端代理API调用。前端不直接调用Twelve Data，后端帮忙调用并缓存，API Key安全存后端。

### Q2: AI分析怎么处理？
**A:** 前端有两处AI介入：
- **快速建议**（每次滑动后）：前端本地规则处理，不走后端，响应快
- **深度分析**（游戏结束时）：后端代理DeepSeek，API Key安全存后端

### Q3: 用户数据（金币、游戏记录）需要存后端吗？
**A:** 需要存后端。防作弊程度：简单存储即可，后端只做存储不做验证，信任前端提交的数据。

### Q4: MVP阶段需要排行榜吗？
**A:** 需要。全球排行榜 + 微信好友排行榜都要。

### Q5: 用户登录方式？
**A:** 微信登录 + 游客都支持。用户身份数据也存后端。

### Q6: 排行榜按什么指标排名？
**A:** 三个榜单：
全球榜：
- 累积收益率榜
- 累积胜率榜
- 累积金币榜
好友榜：
- 累积收益率榜
- 累积胜率榜
- 累积金币榜

### Q7: 游客用户的数据怎么处理？
**A:** 游客用设备ID绑定。换设备数据丢失，但同设备数据不丢。

### Q8: "一局游戏"怎么定义？
**A:** 每只股票 = 一局。用户换股票时结算上一局。

### Q9: 排行榜怎么显示？
**A:** 前端显示11行：
- 前10名根据排行榜动态更新；
- 第11行显示当前用户排名；
- 如果用户在前10，则在对应位置高亮，显示第11名。
- 第一次填写一些模拟假数据填充排行榜。

### Q10: 初始金币多少？破产后怎么处理？
**A:**
- 初始金币：固定30000（价格已归一化，所有股票体验一致，不需要动态调整）
- 每日签到：随机5000-20000（后端决定金额，前端做转盘动画"假装"随机）
- **破产倒计时**：用户金币归零（破产）后进入结算页面，需要等待倒计时结束才能继续：
  - 第1次破产：等待15秒
  - 第2次破产：等待30秒
  - 第3次破产：等待45秒
  - 第4次及以上：等待60秒（封顶）
  - 用户可通过**分享小程序**跳过倒计时
  - 破产次数按**当天**累计，次日重置（前端用localStorage存储，后端无需记录）

### Q11: 每日转盘金币，金额由谁决定？
**A:** 后端决定。前端调接口拿到具体金额，然后播放转盘动画最终"停"在这个数字。

### Q12: 每局游戏的交易记录需要存后端吗？
**A:** 需要。存每局汇总 + 交易明细（每笔买卖都记录）。

### Q13: 时间周期切换时，K线数据怎么处理？
**A:** 后端为每个时间周期分别缓存数据。原因：不同周期的K线粒度不同（如1D用5分钟K线，1W用30分钟K线），无法从周线数据推导出分钟数据。

**切换周期的游戏逻辑：**
- 默认周期为 **1D**（日内5分钟线）
- 如果用户在游戏中途切换周期：
  1. 前端弹窗提示"切换周期将结束当前游戏，是否继续？"
  2. 用户确认后，前端调用 `/api/game/abandon` 结束当前游戏
  3. 再调用 `/api/game/start` 开始新周期的游戏
- 后端 `/api/game/start` 接口逻辑：如果用户有进行中的游戏且请求的 `time_period` 与当前游戏不同，返回错误提示"请先结束当前游戏"

### Q14: 游戏状态恢复怎么处理？
**A:**
- **微信用户**：支持游戏状态恢复。`/api/game/start` 接口会检查是否有 status='playing' 的未完成游戏，有则返回该游戏数据（包括原始K线数据）。
- **游客用户**：不支持恢复。游客换设备后数据丢失，重新开始。
- **K线数据存储**：`game_sessions` 表中新增 `kline_data` 字段，存储本局使用的K线JSON，确保恢复时图表一致。
- 前端实现：微信用户恢复游戏时从后端拉取K线数据和交易记录重建状态；游客用户只做简单的本地存储（可丢失）。

### Q15: 好友排行榜怎么实现？
**A:** 微信好友排行榜需要使用**微信开放数据域**（Open Data Context）。这是微信的安全沙箱机制，好友关系数据只能在沙箱内渲染到Canvas，不能传给后端。
- **实现方式**：请参考微信小程序官方文档 [开放数据域](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/open-data.html)
- **技术要点**：需要创建子域（子包），好友数据在子域内用 `wx.getFriendCloudStorage()` 获取，渲染到共享Canvas，主域显示Canvas
- **后端配合**：后端提供 `/api/rank/friends/sync` 接口接收好友openid列表（前端从开放数据域获取），但这个接口可能用不上，视具体实现而定
- **本文档不做详细技术展开**，请参考微信官方文档实现

### Q16: `/api/game/end` 和 `/api/ai/analyze` 两个AI接口的关系？
**A:** 两个接口功能有重叠，建议统一：
- **推荐方案**：只用 `/api/game/end` 接口，当 `need_ai_analysis=true` 时返回AI分析。这样减少一次网络请求。
- `/api/ai/analyze` 接口保留但可选，用于以下场景：
  - 用户在结算页面点击"重新分析"
  - 流式返回需求（SSE）
- 如果前端不需要流式返回，可以直接删除 `/api/ai/analyze` 接口

### Q17: 分享功能需要后端支持吗？
**A:** 不需要。分享使用微信小程序原生分享能力（`onShareAppMessage`），纯前端实现。后端只需要：
- 支持分享链接带参数（如 `?from=share&user_id=123`），用于统计分享来源
- 破产倒计时跳过逻辑纯前端处理，不需要后端验证
