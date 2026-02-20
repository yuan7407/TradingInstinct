// 股票数据服务
import { API_CONFIG, PRESET_LEVELS, GAME_CONFIG, TIME_PERIODS } from './config'

// 获取历史 K 线数据（自动路由：A股/港股 → 东方财富，美股/加密 → Massive）
export async function fetchHistoricalData(symbol, startDate, endDate, options = {}) {
  const market = detectMarket(symbol)
  if (market === 'cn_a' || market === 'hk') {
    return fetchEastMoneyData(symbol, market, startDate, endDate, options)
  }
  return fetchMassiveData(symbol, startDate, endDate, options)
}

// Massive API（美股/加密货币）
async function fetchMassiveData(symbol, startDate, endDate, options = {}) {
  const { multiplier = 1, timespan = 'day' } = options
  const { baseUrl, apiKey, timeout } = API_CONFIG.massive

  if (!apiKey) {
    console.warn('Massive API Key 未配置')
    return null
  }

  try {
    const normalizedSymbol = normalizePolygonSymbol(symbol)
    const url = `${baseUrl}/v2/aggs/ticker/${encodeURIComponent(normalizedSymbol)}/range/${multiplier}/${timespan}/${startDate}/${endDate}?apiKey=${apiKey}`

    console.log('[StockData] Massive 请求:', url)

    const res = await new Promise((resolve, reject) => {
      uni.request({
        url: url,
        method: 'GET',
        timeout: timeout,
        success: (response) => resolve(response),
        fail: (err) => reject(err)
      })
    })

    console.log('[StockData] Massive 响应状态:', res.statusCode, '数据条数:', res.data?.resultsCount)

    const parsed = parsePolygonKlines(res.data)
    if (parsed?.length) return parsed

    return null
  } catch (error) {
    console.warn('[StockData] Massive 请求失败:', error)
    return null
  }
}

function normalizePolygonSymbol(symbol) {
  if (!symbol) return symbol
  // 加密货币: BTC/USD → X:BTCUSD（Polygon 格式）
  if (symbol.includes('/')) {
    return 'X:' + symbol.replace('/', '')
  }
  return symbol
}

function parsePolygonKlines(data) {
  if (!data) return null

  if (Array.isArray(data.values)) {
    return data.values.map((item, index) => ({
      index: index,
      date: item.datetime || item.date,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseInt(item.volume || 0)
    })).reverse()
  }

  if (Array.isArray(data.results)) {
    return data.results.map((item, index) => ({
      index: index,
      date: formatPolygonDate(item.t || item.timestamp || item.date),
      open: parseFloat(item.o !== undefined ? item.o : item.open),
      high: parseFloat(item.h !== undefined ? item.h : item.high),
      low: parseFloat(item.l !== undefined ? item.l : item.low),
      close: parseFloat(item.c !== undefined ? item.c : item.close),
      volume: parseInt(item.v !== undefined ? item.v : (item.volume || 0))
    })).filter(item => Number.isFinite(item.open)).reverse()
  }

  return null
}

function formatPolygonDate(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

// === 东方财富 API（A股 + 港股）===

// 根据 symbol 格式自动识别市场
function detectMarket(symbol) {
  if (!symbol) return 'us'
  // 港股: 0700.HK, 1810.HK 等
  if (symbol.endsWith('.HK')) return 'hk'
  // A股: 纯数字 6 位
  if (/^\d{6}$/.test(symbol)) return 'cn_a'
  // 加密货币: BTC/USD 等
  if (symbol.includes('/')) return 'crypto'
  // 其余视为美股
  return 'us'
}

// symbol → 东方财富 secid 格式（市场前缀.代码）
function toEastMoneySecid(symbol, market) {
  if (market === 'hk') {
    // 0700.HK → 116.00700（港股前缀 116，代码补齐 5 位）
    const code = symbol.replace('.HK', '').padStart(5, '0')
    return `116.${code}`
  }
  // A股：根据代码首位判断沪/深
  // 6xx/9xx → 上海(1)，0xx/2xx/3xx → 深圳(0)
  const prefix = symbol.startsWith('6') || symbol.startsWith('9') ? '1' : '0'
  return `${prefix}.${symbol}`
}

// timespan + multiplier → 东方财富 klt（K线周期类型）
function toEastMoneyKlt(timespan, multiplier) {
  if (timespan === 'minute') {
    if (multiplier <= 1) return '1'       // 1分钟K
    if (multiplier <= 5) return '5'       // 5分钟K
    if (multiplier <= 15) return '15'     // 15分钟K
    if (multiplier <= 30) return '30'     // 30分钟K
    return '60'                           // 60分钟K
  }
  if (timespan === 'hour') return '60'    // 60分钟K
  if (timespan === 'day') return '101'    // 日K
  if (timespan === 'week') return '102'   // 周K
  return '101'                            // 默认日K
}

// 解析东方财富响应为标准 OHLCV 格式
// 每行: "日期,开盘,收盘,最高,最低,成交量,..."
// 注意: 东方财富顺序是 open, close, high, low（非标准 OHLC）
function parseEastMoneyKlines(data) {
  if (!data?.data?.klines?.length) return null

  return data.data.klines.map((line, index) => {
    const parts = line.split(',')
    return {
      index: index,
      date: parts[0],
      open: parseFloat(parts[1]),
      close: parseFloat(parts[2]),  // 东方财富第2列是 close
      high: parseFloat(parts[3]),
      low: parseFloat(parts[4]),
      volume: parseInt(parts[5] || 0)
    }
  }).filter(item => Number.isFinite(item.open))
  // 东方财富返回时间升序，无需 reverse
}

// 东方财富 API 请求
async function fetchEastMoneyData(symbol, market, startDate, endDate, options = {}) {
  const { multiplier = 1, timespan = 'day' } = options
  const { baseUrl, timeout } = API_CONFIG.eastmoney

  const secid = toEastMoneySecid(symbol, market)
  const klt = toEastMoneyKlt(timespan, multiplier)

  // 分钟/小时级 K线：扩大请求范围以覆盖节假日（春节/国庆可能连休 9 天+周末）
  // 日K/周K 不需要扩大，日期范围本身已足够
  let adjustedStart = startDate
  if (timespan === 'minute' || timespan === 'hour') {
    const start = new Date(startDate)
    start.setDate(start.getDate() - 14) // 多请求 14 天缓冲
    adjustedStart = start.toISOString().slice(0, 10)
  }

  const beg = adjustedStart.replace(/-/g, '')
  const end = endDate.replace(/-/g, '')

  const url = `${baseUrl}?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=${klt}&fqt=1&beg=${beg}&end=${end}`

  console.log(`[StockData] 东方财富请求: secid=${secid} klt=${klt} ${adjustedStart}~${endDate}`)

  try {
    const res = await new Promise((resolve, reject) => {
      uni.request({
        url: url,
        method: 'GET',
        timeout: timeout,
        success: (response) => resolve(response),
        fail: (err) => reject(err)
      })
    })

    console.log('[StockData] 东方财富响应状态:', res.statusCode, 'K线数:', res.data?.data?.klines?.length || 0)

    const parsed = parseEastMoneyKlines(res.data)
    if (parsed?.length) return parsed

    console.warn('[StockData] 东方财富无数据:', symbol)
    return null
  } catch (error) {
    console.warn('[StockData] 东方财富请求失败:', error)
    return null
  }
}

// 从本地存储获取缓存数据
export function getCachedLevelData() {
  try {
    const cached = uni.getStorageSync('cachedLevels')
    return cached ? JSON.parse(cached) : {}
  } catch {
    return {}
  }
}

// 缓存关卡数据
export function cacheLevelData(levelId, data) {
  try {
    const cached = getCachedLevelData()
    cached[levelId] = {
      data: data,
      timestamp: Date.now()
    }
    uni.setStorageSync('cachedLevels', JSON.stringify(cached))
  } catch (error) {
    console.error('缓存数据失败:', error)
  }
}

// 获取随机关卡数据
export async function getRandomLevelData() {
  const usedLevels = uni.getStorageSync('usedLevels') || []
  const availableLevels = PRESET_LEVELS.filter(level =>
    !usedLevels.includes(level.symbol)
  )

  // 所有关卡都用完了，重置
  if (availableLevels.length === 0) {
    uni.removeStorageSync('usedLevels')
    return getRandomLevelData()
  }

  // 随机选择一个关卡
  const selectedLevel = availableLevels[Math.floor(Math.random() * availableLevels.length)]

  // 检查缓存
  const cached = getCachedLevelData()
  const levelId = `${selectedLevel.symbol}_${selectedLevel.period}`

  if (cached[levelId]?.data) {
    usedLevels.push(selectedLevel.symbol)
    uni.setStorageSync('usedLevels', usedLevels)
    return {
      ...selectedLevel,
      klineData: cached[levelId].data
    }
  }

  // 从 API 获取数据（endDate 动态计算为今天，获取更长的历史数据）
  const [startDate] = selectedLevel.period.split('/')
  const endDate = new Date().toISOString().slice(0, 10)
  const data = await fetchHistoricalData(selectedLevel.symbol, startDate, endDate)

  if (data) {
    cacheLevelData(levelId, data)
    usedLevels.push(selectedLevel.symbol)
    uni.setStorageSync('usedLevels', usedLevels)
    return {
      ...selectedLevel,
      klineData: data
    }
  }

  return null
}

// 生成模拟 K 线数据（API 失败时的备用方案）
export function generateMockData(length = 300) {
  const klines = []
  let basePrice = 100
  const trend = Math.random() > 0.5 ? 0.3 : -0.3

  for (let i = 0; i < length; i++) {
    const trendEffect = trend * (Math.random() * 1.5)
    const volatility = (Math.random() - 0.5) * 5
    basePrice = basePrice * (1 + (trendEffect + volatility) / 100)
    basePrice = Math.max(30, Math.min(500, basePrice))

    const open = i === 0 ? basePrice : klines[i-1]?.close || basePrice
    const change = (Math.random() - 0.5 + trend/10) * 4
    const close = Math.max(30, Math.min(500, open * (1 + change/100)))
    const high = Math.max(open, close) * (1 + Math.random() * 0.015)
    const low = Math.min(open, close) * (1 - Math.random() * 0.015)

    klines.push({
      index: i,
      open: open,
      close: close,
      high: Math.min(500, high),
      low: Math.max(30, low),
      date: `Day ${i+1}`
    })
  }

  return klines
}

// 提取游戏用的 K 线片段并归一化价格（新手模式使用）
export function extractGameSegment(fullData) {
  const klineLength = GAME_CONFIG.beginnerKlineLength || 1000
  if (!fullData || fullData.length < klineLength) {
    return generateMockData(klineLength)
  }

  const maxStart = Math.max(0, fullData.length - klineLength)
  const startIdx = Math.floor(Math.random() * maxStart)
  const segment = fullData.slice(startIdx, startIdx + klineLength)

  // 计算价格范围并归一化
  const prices = segment.map(item => item.close)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice || 1

  const { min: targetMin, max: targetMax } = GAME_CONFIG.beginnerPriceRange
  const targetRange = targetMax - targetMin

  return segment.map((item, index) => ({
    index: index,
    open: ((item.open - minPrice) / priceRange * targetRange + targetMin),
    close: ((item.close - minPrice) / priceRange * targetRange + targetMin),
    high: ((item.high - minPrice) / priceRange * targetRange + targetMin),
    low: ((item.low - minPrice) / priceRange * targetRange + targetMin),
    date: item.date || `Day ${index + 1}`
  }))
}

// 准备真实模式游戏数据（不归一化、不随机选段）
export function prepareGameData(fullData) {
  if (!fullData || !fullData.length) return null
  return fullData.map((item, index) => ({
    index: index,
    open: item.open,
    close: item.close,
    high: item.high,
    low: item.low,
    date: item.date || `Day ${index + 1}`
  }))
}

// 获取随机股票信息（用于模拟数据）
export function getRandomStockInfo() {
  return PRESET_LEVELS[Math.floor(Math.random() * PRESET_LEVELS.length)]
}

// 计算指定时间周期的日期范围
export function calculateDateRange(periodKey) {
  const period = TIME_PERIODS[periodKey]
  if (!period) return null

  const endDate = new Date()
  const startDate = new Date()

  switch (period.dateUnit) {
    case 'day':
      startDate.setDate(endDate.getDate() - period.dateRange)
      break
    case 'month':
      startDate.setMonth(endDate.getMonth() - period.dateRange)
      break
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - period.dateRange)
      break
  }

  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
    multiplier: period.multiplier,
    timespan: period.timespan
  }
}
