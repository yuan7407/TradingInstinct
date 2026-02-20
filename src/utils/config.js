//1. 域名 - 备案
//2. 小程序
// uni-app: vue

//后端：数据类别（历史记录。..股票数据）、用户体系映射、实时性要求（请求<xxxx)
//调用API



// 统一配置管理
// 注意：生产环境应该通过后端代理访问 API，避免密钥暴露

// API 配置
export const API_CONFIG = {
  // DeepSeek AI 分析
  deepseek: {
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    // 从环境变量读取，开发时可设置默认值
    apiKey: process.env.VUE_APP_DEEPSEEK_KEY || '',
    model: 'deepseek-chat',
    timeout: 10000
  },

  // Massive (原 Polygon.io) 股票数据
  massive: {
    baseUrl: 'https://api.massive.com',
    // 从环境变量读取
    apiKey: process.env.VUE_APP_MASSIVE_KEY || '',
    timeout: 10000
  },

  // 东方财富（A股 + 港股）
  eastmoney: {
    baseUrl: 'https://push2his.eastmoney.com/api/qt/stock/kline/get',
    timeout: 10000
  }
}

// 游戏配置
export const GAME_CONFIG = {
  initialAsset: 10000,      // 初始金币
  minAsset: 50,             // 最低金币阈值（破产线）
  tradeRiskPercent: 0.10,   // 每次交易使用当前资产的 10%（2X=20%）
  commissionRate: 0.001,    // 手续费 0.1%
  visibleKlines: 30,        // 可见K线数量
  // 新手模式归一化参数
  beginnerKlineLength: 1000,
  beginnerPriceRange: { min: 50, max: 300 }
}

// 市场规则
export const MARKET_RULES = {
  us:     { canShort: true,  label: '美股' },
  cn_a:   { canShort: false, label: 'A股' },
  hk:     { canShort: false, label: '港股' },
  crypto: { canShort: true,  label: '加密货币' }
}

// 预设关卡数据（股票信息）
// market: 'us'=美股(可做空), 'cn_a'=A股(不可做空), 'hk'=港股(不可做空), 'crypto'=加密(可做空)
export const PRESET_LEVELS = [
  // === 美股（可做空）=== dataSource: 'massive' = Massive API 支持
  { symbol: 'NVDA',    name: '英伟达',     market: 'us', dataSource: 'massive', period: '2023-01-01/2024-01-01', description: 'AI芯片龙头的黄金时期' },
  { symbol: 'AAPL',    name: '苹果',       market: 'us', dataSource: 'massive', period: '2022-06-01/2023-06-01', description: '供应链恢复期' },
  { symbol: 'TSLA',    name: '特斯拉',     market: 'us', dataSource: 'massive', period: '2021-01-01/2022-01-01', description: '电动车泡沫高峰' },
  { symbol: 'GME',     name: '游戏驿站',   market: 'us', dataSource: 'massive', period: '2020-12-01/2021-03-01', description: '散户逼空事件' },
  { symbol: 'MSFT',    name: '微软',       market: 'us', dataSource: 'massive', period: '2023-01-01/2024-01-01', description: '云计算与AI商业化' },
  { symbol: 'AMZN',    name: '亚马逊',     market: 'us', dataSource: 'massive', period: '2022-01-01/2023-01-01', description: '电商降温与成本优化' },
  { symbol: 'META',    name: 'Meta',       market: 'us', dataSource: 'massive', period: '2022-07-01/2023-07-01', description: '降本增效与广告复苏' },
  { symbol: 'GOOG',    name: '谷歌',       market: 'us', dataSource: 'massive', period: '2022-01-01/2023-01-01', description: '广告周期回落' },
  { symbol: 'NFLX',    name: '奈飞',       market: 'us', dataSource: 'massive', period: '2021-11-01/2022-11-01', description: '增长放缓与订阅调整' },
  { symbol: 'AMD',     name: 'AMD',        market: 'us', dataSource: 'massive', period: '2020-05-01/2021-05-01', description: '芯片景气上行' },
  { symbol: 'JPM',     name: '摩根大通',   market: 'us', dataSource: 'massive', period: '2022-01-01/2023-01-01', description: '加息周期与银行板块波动' },
  { symbol: 'XOM',     name: '埃克森美孚', market: 'us', dataSource: 'massive', period: '2021-06-01/2022-06-01', description: '能源价格高位运行' },
  { symbol: 'DIS',     name: '迪士尼',     market: 'us', dataSource: 'massive', period: '2022-03-01/2023-03-01', description: '流媒体转型压力' },
  { symbol: 'PLTR',    name: 'Palantir',   market: 'us', dataSource: 'massive', period: '2023-01-01/2024-01-01', description: 'AI数据分析平台爆发' },
  { symbol: 'AVGO',    name: '博通',       market: 'us', dataSource: 'massive', period: '2023-06-01/2024-06-01', description: 'AI基础设施芯片受益' },
  { symbol: 'CRM',     name: 'Salesforce', market: 'us', dataSource: 'massive', period: '2022-09-01/2023-09-01', description: 'SaaS龙头降本增效' },
  { symbol: 'UBER',    name: 'Uber',       market: 'us', dataSource: 'massive', period: '2023-01-01/2024-01-01', description: '出行平台盈利拐点' },
  { symbol: 'ABNB',    name: 'Airbnb',     market: 'us', dataSource: 'massive', period: '2022-06-01/2023-06-01', description: '旅游复苏红利' },
  { symbol: 'SQ',      name: 'Block',      market: 'us', dataSource: 'massive', period: '2021-06-01/2022-06-01', description: '支付科技估值回调' },
  { symbol: 'PYPL',    name: 'PayPal',     market: 'us', dataSource: 'massive', period: '2021-07-01/2022-07-01', description: '支付巨头增长瓶颈' },
  { symbol: 'SHOP',    name: 'Shopify',    market: 'us', dataSource: 'massive', period: '2021-11-01/2022-11-01', description: '电商SaaS泡沫破裂' },
  { symbol: 'ARM',     name: 'ARM',        market: 'us', dataSource: 'massive', period: '2023-09-01/2024-06-01', description: 'AI芯片架构IPO热潮' },
  { symbol: 'SNOW',    name: 'Snowflake',  market: 'us', dataSource: 'massive', period: '2022-01-01/2023-01-01', description: '云数据仓库高增长' },
  { symbol: 'COIN',    name: 'Coinbase',   market: 'us', dataSource: 'massive', period: '2021-04-01/2022-04-01', description: '加密交易所上市元年' },
  { symbol: 'NET',     name: 'Cloudflare', market: 'us', dataSource: 'massive', period: '2022-01-01/2023-01-01', description: '网络安全高成长' },
  { symbol: 'INTC',    name: '英特尔',     market: 'us', dataSource: 'massive', period: '2022-01-01/2023-01-01', description: '芯片巨头转型阵痛' },
  { symbol: 'BA',      name: '波音',       market: 'us', dataSource: 'massive', period: '2022-06-01/2023-06-01', description: '航空制造复苏与安全危机' },
  { symbol: 'SOFI',    name: 'SoFi',       market: 'us', dataSource: 'massive', period: '2022-01-01/2023-01-01', description: '金融科技新势力' },
  // === 加密货币（可做空）=== dataSource: 'massive' = Massive API 支持
  { symbol: 'BTC/USD', name: '比特币',     market: 'crypto', dataSource: 'massive', period: '2020-10-01/2021-04-01', description: '加密货币牛市' },
  { symbol: 'ETH/USD', name: '以太坊',     market: 'crypto', dataSource: 'massive', period: '2021-01-01/2021-11-01', description: 'DeFi与NFT生态爆发' },
  { symbol: 'DOGE/USD', name: '狗狗币',    market: 'crypto', dataSource: 'massive', period: '2021-01-01/2021-07-01', description: 'Meme币社交媒体狂潮' },
  // === A股（不可做空）=== dataSource: 'eastmoney' = 东方财富 API
  { symbol: '600519',  name: '贵州茅台',   market: 'cn_a', dataSource: 'eastmoney', period: '2023-01-01/2024-01-01', description: '白酒龙头消费复苏' },
  { symbol: '300750',  name: '宁德时代',   market: 'cn_a', dataSource: 'eastmoney', period: '2022-01-01/2023-01-01', description: '动力电池行业领跑者' },
  { symbol: '002594',  name: '比亚迪',     market: 'cn_a', dataSource: 'eastmoney', period: '2023-06-01/2024-06-01', description: '新能源汽车销量爆发' },
  { symbol: '601318',  name: '中国平安',   market: 'cn_a', dataSource: 'eastmoney', period: '2022-01-01/2023-01-01', description: '保险行业龙头波动' },
  { symbol: '000858',  name: '五粮液',     market: 'cn_a', dataSource: 'eastmoney', period: '2021-01-01/2022-01-01', description: '高端白酒景气周期' },
  { symbol: '600036',  name: '招商银行',   market: 'cn_a', dataSource: 'eastmoney', period: '2023-01-01/2024-01-01', description: '零售银行利率调整' },
  { symbol: '002049',  name: '紫光国微',   market: 'cn_a', dataSource: 'eastmoney', period: '2022-06-01/2023-06-01', description: '芯片设计国产替代' },
  { symbol: '300059',  name: '东方财富',   market: 'cn_a', dataSource: 'eastmoney', period: '2021-06-01/2022-06-01', description: '互联网券商龙头波动' },
  { symbol: '600276',  name: '恒瑞医药',   market: 'cn_a', dataSource: 'eastmoney', period: '2021-01-01/2022-01-01', description: '创新药龙头集采压力' },
  { symbol: '000333',  name: '美的集团',   market: 'cn_a', dataSource: 'eastmoney', period: '2023-01-01/2024-01-01', description: '家电龙头出海扩张' },
  { symbol: '002475',  name: '立讯精密',   market: 'cn_a', dataSource: 'eastmoney', period: '2022-01-01/2023-01-01', description: '消费电子代工龙头' },
  { symbol: '601899',  name: '紫金矿业',   market: 'cn_a', dataSource: 'eastmoney', period: '2023-01-01/2024-01-01', description: '黄金铜矿资源景气' },
  { symbol: '300274',  name: '阳光电源',   market: 'cn_a', dataSource: 'eastmoney', period: '2022-06-01/2023-06-01', description: '光伏逆变器全球龙头' },
  { symbol: '601012',  name: '隆基绿能',   market: 'cn_a', dataSource: 'eastmoney', period: '2022-01-01/2023-01-01', description: '光伏硅片产能过剩' },
  { symbol: '600900',  name: '长江电力',   market: 'cn_a', dataSource: 'eastmoney', period: '2023-01-01/2024-01-01', description: '水电防御龙头稳健' },
  // === 港股（不可做空）=== dataSource: 'eastmoney' = 东方财富 API
  { symbol: '0700.HK', name: '腾讯控股',   market: 'hk', dataSource: 'eastmoney', period: '2022-01-01/2023-01-01', description: '互联网监管后复苏' },
  { symbol: '1810.HK', name: '小米集团',   market: 'hk', dataSource: 'eastmoney', period: '2023-01-01/2024-01-01', description: '消费电子与造车新篇' },
  { symbol: '3690.HK', name: '美团',       market: 'hk', dataSource: 'eastmoney', period: '2022-06-01/2023-06-01', description: '本地生活竞争加剧' },
  { symbol: '9988.HK', name: '阿里巴巴',   market: 'hk', dataSource: 'eastmoney', period: '2022-01-01/2023-01-01', description: '电商格局重塑' },
  { symbol: '9618.HK', name: '京东集团',   market: 'hk', dataSource: 'eastmoney', period: '2022-06-01/2023-06-01', description: '电商物流一体化' },
  { symbol: '0388.HK', name: '港交所',     market: 'hk', dataSource: 'eastmoney', period: '2023-01-01/2024-01-01', description: '资本市场枢纽地位' },
  { symbol: '2318.HK', name: '中国平安HK', market: 'hk', dataSource: 'eastmoney', period: '2022-06-01/2023-06-01', description: '保险金融港股估值修复' },
  { symbol: '1211.HK', name: '比亚迪HK',   market: 'hk', dataSource: 'eastmoney', period: '2023-01-01/2024-01-01', description: '新能源车港股表现' },
  { symbol: '0941.HK', name: '中国移动',   market: 'hk', dataSource: 'eastmoney', period: '2023-01-01/2024-01-01', description: '电信央企高股息' },
  { symbol: '2020.HK', name: '安踏体育',   market: 'hk', dataSource: 'eastmoney', period: '2022-01-01/2023-01-01', description: '国潮运动品牌崛起' },
  { symbol: '1024.HK', name: '快手',       market: 'hk', dataSource: 'eastmoney', period: '2021-06-01/2022-06-01', description: '短视频商业化探索' },
  { symbol: '2015.HK', name: '理想汽车',   market: 'hk', dataSource: 'eastmoney', period: '2023-01-01/2024-01-01', description: '增程式电动SUV爆发' }
]

// 时间周期配置
export const TIME_PERIODS = {
  '1H': {
    label: '1时',
    multiplier: 1,
    timespan: 'minute',
    dateRange: 7,
    dateUnit: 'day',
    maxDataPoints: 60,
    description: '超短线'
  },
  '1D': {
    label: '1日',
    multiplier: 5,
    timespan: 'minute',
    dateRange: 3,
    dateUnit: 'day',
    maxDataPoints: 78,
    description: '日内交易'
  },
  '1W': {
    label: '1周',
    multiplier: 30,
    timespan: 'minute',
    dateRange: 21,
    dateUnit: 'day',
    maxDataPoints: 140,
    description: '短线波段'
  },
  '1M': {
    label: '1月',
    multiplier: 1,
    timespan: 'hour',
    dateRange: 3,
    dateUnit: 'month',
    maxDataPoints: 180,
    description: '波段交易'
  },
  '1Y': {
    label: '1年',
    multiplier: 1,
    timespan: 'day',
    dateRange: 1,
    dateUnit: 'year',
    maxDataPoints: 252,
    description: '长期投资'
  },
  'ALL': {
    label: '全部',
    multiplier: 1,
    timespan: 'week',
    dateRange: 5,
    dateUnit: 'year',
    maxDataPoints: 260,
    description: '历史全貌'
  }
}

// 默认时间周期
export const DEFAULT_TIME_PERIOD = '1M'

// 时间周期显示顺序
export const TIME_PERIOD_ORDER = ['1H', '1D', '1W', '1M', '1Y', 'ALL']

// UI 配置
export const UI_CONFIG = {
  colors: {
    up: '#00d88a',      // 上涨颜色
    down: '#ff5b5b',    // 下跌颜色
    background: '#0a0e27',
    chartBg: '#1a1a2e'
  }
}
