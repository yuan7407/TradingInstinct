// 股票数据服务
import { API_CONFIG, PRESET_LEVELS, GAME_CONFIG, TIME_PERIODS } from './config'

// 获取历史 K 线数据
export async function fetchHistoricalData(symbol, startDate, endDate, options = {}) {
  const { multiplier = 1, timespan = 'day' } = options
  const { baseUrl, apiKey, timeout } = API_CONFIG.massive

  if (!apiKey) {
    console.warn('Massive API Key 未配置')
    return null
  }

  try {
    const normalizedSymbol = normalizeMassiveSymbol(symbol)
    const url = `${baseUrl}/v3/aggs/ticker/${encodeURIComponent(normalizedSymbol)}/range/${multiplier}/${timespan}/${startDate}/${endDate}?apiKey=${apiKey}`

    const response = await uni.request({
      url: url,
      method: 'GET',
      timeout: timeout
    })

    const parsed = parseMassiveKlines(response.data)
    if (parsed?.length) return parsed

    return null
  } catch (error) {
    console.error('获取历史数据失败:', error)
    return null
  }
}

function normalizeMassiveSymbol(symbol) {
  if (!symbol) return symbol
  if (symbol.includes('/')) {
    return symbol.replace('/', '')
  }
  return symbol
}

function parseMassiveKlines(data) {
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
      date: formatMassiveDate(item.t || item.timestamp || item.date),
      open: parseFloat(item.o !== undefined ? item.o : item.open),
      high: parseFloat(item.h !== undefined ? item.h : item.high),
      low: parseFloat(item.l !== undefined ? item.l : item.low),
      close: parseFloat(item.c !== undefined ? item.c : item.close),
      volume: parseInt(item.v !== undefined ? item.v : (item.volume || 0))
    })).filter(item => Number.isFinite(item.open)).reverse()
  }

  return null
}

function formatMassiveDate(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
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
export function generateMockData() {
  const klines = []
  let basePrice = 100
  const trend = Math.random() > 0.5 ? 0.3 : -0.3
  const { min, max } = GAME_CONFIG.priceRange

  for (let i = 0; i < GAME_CONFIG.klineLength; i++) {
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

// 提取游戏用的 K 线片段并归一化价格
export function extractGameSegment(fullData) {
  if (!fullData || fullData.length < GAME_CONFIG.klineLength) {
    return generateMockData()
  }

  const segmentLength = GAME_CONFIG.klineLength
  const maxStart = Math.max(0, fullData.length - segmentLength)
  const startIdx = Math.floor(Math.random() * maxStart)
  const segment = fullData.slice(startIdx, startIdx + segmentLength)

  // 计算价格范围并归一化
  const prices = segment.map(item => item.close)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice || 1

  const { min: targetMin, max: targetMax } = GAME_CONFIG.priceRange
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
