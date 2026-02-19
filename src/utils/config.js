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

  // Massive (Polygon) 股票数据
  massive: {
    baseUrl: 'https://api.massive.com',
    // 从环境变量读取
    apiKey: process.env.VUE_APP_MASSIVE_KEY || '',
    timeout: 10000
  }
}

// 游戏配置
export const GAME_CONFIG = {
  initialAsset: 10000,      // 初始金币
  minAsset: 50,             // 最低金币阈值（破产线）
  tradeRiskPercent: 0.10,   // 每次交易使用当前资产的 10%（2X=20%）
  klineLength: 1000,        // K线数据长度
  visibleKlines: 30,        // 可见K线数量
  priceRange: {
    min: 50,
    max: 300
  }
}

// 预设关卡数据（股票信息）
export const PRESET_LEVELS = [
  {
    symbol: 'NVDA',
    name: '英伟达',
    period: '2023-01-01/2024-01-01',
    description: 'AI芯片龙头的黄金时期'
  },
  {
    symbol: 'AAPL',
    name: '苹果',
    period: '2022-06-01/2023-06-01',
    description: '供应链恢复期'
  },
  {
    symbol: 'TSLA',
    name: '特斯拉',
    period: '2021-01-01/2022-01-01',
    description: '电动车泡沫高峰'
  },
  {
    symbol: 'GME',
    name: '游戏驿站',
    period: '2020-12-01/2021-03-01',
    description: '散户逼空事件'
  },
  {
    symbol: 'BTC/USD',
    name: '比特币',
    period: '2020-10-01/2021-04-01',
    description: '加密货币牛市'
  },
  {
    symbol: 'MSFT',
    name: '微软',
    period: '2023-01-01/2024-01-01',
    description: '云计算与AI商业化'
  },
  {
    symbol: 'AMZN',
    name: '亚马逊',
    period: '2022-01-01/2023-01-01',
    description: '电商降温与成本优化'
  },
  {
    symbol: 'META',
    name: 'Meta',
    period: '2022-07-01/2023-07-01',
    description: '降本增效与广告复苏'
  },
  {
    symbol: 'GOOG',
    name: '谷歌',
    period: '2022-01-01/2023-01-01',
    description: '广告周期回落'
  },
  {
    symbol: 'NFLX',
    name: '奈飞',
    period: '2021-11-01/2022-11-01',
    description: '增长放缓与订阅调整'
  },
  {
    symbol: 'AMD',
    name: 'AMD',
    period: '2020-05-01/2021-05-01',
    description: '芯片景气上行'
  },
  {
    symbol: 'JPM',
    name: '摩根大通',
    period: '2022-01-01/2023-01-01',
    description: '加息周期与银行板块波动'
  },
  {
    symbol: 'XOM',
    name: '埃克森美孚',
    period: '2021-06-01/2022-06-01',
    description: '能源价格高位运行'
  },
  {
    symbol: 'DIS',
    name: '迪士尼',
    period: '2022-03-01/2023-03-01',
    description: '流媒体转型压力'
  }
]

// 时间周期配置
export const TIME_PERIODS = {
  '1D': {
    label: '1日',
    multiplier: 5,
    timespan: 'minute',
    dateRange: 1,
    dateUnit: 'day',
    maxDataPoints: 78,
    description: '日内交易'
  },
  '1W': {
    label: '1周',
    multiplier: 30,
    timespan: 'minute',
    dateRange: 7,
    dateUnit: 'day',
    maxDataPoints: 140,
    description: '短线波段'
  },
  '1M': {
    label: '1月',
    multiplier: 1,
    timespan: 'hour',
    dateRange: 1,
    dateUnit: 'month',
    maxDataPoints: 180,
    description: '波段交易'
  },
  '3M': {
    label: '3月',
    multiplier: 1,
    timespan: 'day',
    dateRange: 3,
    dateUnit: 'month',
    maxDataPoints: 65,
    description: '趋势跟踪'
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
export const DEFAULT_TIME_PERIOD = '3M'

// 时间周期显示顺序
export const TIME_PERIOD_ORDER = ['1D', '1W', '1M', '3M', '1Y', 'ALL']

// UI 配置
export const UI_CONFIG = {
  colors: {
    up: '#00d88a',      // 上涨颜色
    down: '#ff5b5b',    // 下跌颜色
    background: '#0a0e27',
    chartBg: '#1a1a2e'
  }
}
