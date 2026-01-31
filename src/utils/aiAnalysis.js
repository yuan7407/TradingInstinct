// AI 分析服务
import { API_CONFIG } from './config'

// 快速AI建议（本地规则，每次决策后调用）
export function getQuickAISuggestion(klineData, currentIndex, lastDecision, allDecisions) {
  if (!klineData || !lastDecision) return ''

  // 获取最近的K线数据用于分析
  const recentKlines = klineData.slice(Math.max(0, currentIndex - 10), currentIndex)
  if (recentKlines.length < 3) return ''

  // 计算趋势
  const trend = analyzeTrend(recentKlines)
  // 计算动量
  const momentum = analyzeMomentum(recentKlines)
  // 分析用户决策
  const decisionFeedback = analyzeDecision(lastDecision, trend, momentum)

  return decisionFeedback
}

// 分析趋势
function analyzeTrend(klines) {
  if (klines.length < 3) return 'neutral'

  const firstClose = klines[0].close
  const lastClose = klines[klines.length - 1].close
  const change = (lastClose - firstClose) / firstClose

  if (change > 0.03) return 'strong_up'
  if (change > 0.01) return 'up'
  if (change < -0.03) return 'strong_down'
  if (change < -0.01) return 'down'
  return 'neutral'
}

// 分析动量
function analyzeMomentum(klines) {
  if (klines.length < 5) return 'neutral'

  // 最近3根K线的平均涨幅
  const recent = klines.slice(-3)
  const older = klines.slice(-6, -3)

  if (older.length === 0) return 'neutral'

  const recentAvg = recent.reduce((sum, k) => sum + k.close, 0) / recent.length
  const olderAvg = older.reduce((sum, k) => sum + k.close, 0) / older.length

  const momentumChange = (recentAvg - olderAvg) / olderAvg

  if (momentumChange > 0.02) return 'accelerating'
  if (momentumChange < -0.02) return 'decelerating'
  return 'steady'
}

// 分析用户决策并给出建议
function analyzeDecision(decision, trend, momentum) {
  const suggestions = []

  if (decision.type === 'buy') {
    // 用户买入
    if (trend === 'strong_up' && momentum === 'accelerating') {
      suggestions.push('上一轮建议买入，趋势强劲，动量加速，顺势操作正确。')
    } else if (trend === 'strong_down') {
      suggestions.push('上一轮建议观望，下跌趋势中买入风险较高，注意止损。')
    } else if (trend === 'down' && momentum === 'decelerating') {
      suggestions.push('上一轮建议等待，下跌动量减弱但趋势未反转，可能是抄底机会。')
    } else if (trend === 'up') {
      suggestions.push('上一轮建议买入，上涨趋势中顺势做多是正确选择。')
    } else {
      suggestions.push('上一轮震荡行情，此时的量化策略会选择小仓位试探。')
    }
  } else if (decision.type === 'sell') {
    // 用户卖出（平多仓）
    if (trend === 'strong_down') {
      suggestions.push('上一轮建议卖出，下跌趋势中及时止盈/止损是明智的。')
    } else if (trend === 'strong_up' && momentum === 'accelerating') {
      suggestions.push('上一轮建议持有，强势上涨中卖出可能错过更大收益。')
    } else if (momentum === 'decelerating') {
      suggestions.push('上一轮建议减仓，动量减弱时适当获利了结是稳健策略。')
    } else {
      suggestions.push('上一轮震荡行情，落袋为安不失为好选择。')
    }
  } else if (decision.type === 'short') {
    // 用户做空
    if (trend === 'strong_down') {
      suggestions.push('上一轮建议做空，下跌趋势中顺势做空是正确的。')
    } else if (trend === 'strong_up') {
      suggestions.push('上一轮建议观望，强势上涨中做空风险极高。')
    } else if (trend === 'down') {
      suggestions.push('上一轮建议做空，趋势向下，空单方向正确。')
    } else {
      suggestions.push('上一轮震荡行情，此时做空需要严格止损。')
    }
  } else if (decision.type === 'cover') {
    // 用户平空
    if (trend === 'up' || trend === 'strong_up') {
      suggestions.push('上一轮建议平空，趋势反转及时止损是正确的。')
    } else if (trend === 'strong_down') {
      suggestions.push('上一轮建议持有空单，下跌趋势中平空可能过早。')
    } else {
      suggestions.push('上一轮震荡行情，平空落袋为安是稳健选择。')
    }
  }

  return suggestions[0] || ''
}

// 调用 DeepSeek API 进行深度分析
async function analyzeWithDeepSeek(decisions, klineData, stats, stockInfo) {
  const { endpoint, apiKey, model, timeout } = API_CONFIG.deepseek

  if (!apiKey) {
    console.warn('DeepSeek API Key 未配置')
    return {
      provider: 'DeepSeek分析',
      icon: '',
      content: 'API未配置，请设置环境变量'
    }
  }

  // 构建系统提示词
  const systemPrompt = `你是「盘感」App的AI交易教练。盘感是一款通过模拟真实K线走势训练用户交易直觉的小程序，帮助用户在无风险环境中提升买卖时机判断能力。

请用100-150字分析用户的交易表现，并结合这只股票的公司背景、行业地位、历史表现特点，给出专业、易懂的操作建议。

要求：
1. 语言简洁专业，避免空话套话
2. 指出1-2个做得好的地方（如有）
3. 给出1-2条具体可执行的改进建议
4. 结合该股票特性给出针对性建议（如波动性、趋势性等）`

  // 构建用户消息
  const stockName = stockInfo?.stockName || '未知股票'
  const stockSymbol = stockInfo?.stockSymbol || ''
  const userMessage = `股票：${stockName}（${stockSymbol}）
交易次数：${decisions.length}
总收益率：${stats.totalReturn?.toFixed(2) || 0}%
胜率：${stats.winRate?.toFixed(1) || 0}%
最大回撤：${stats.maxDrawdown?.toFixed(1) || 0}%

请分析我的交易表现并给出建议。`

  try {
    const response = await uni.request({
      url: endpoint,
      method: 'POST',
      timeout: timeout,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 300,
        stream: false
      }
    })

    if (response?.data?.choices?.[0]) {
      return {
        provider: 'DeepSeek分析',
        icon: '',
        content: response.data.choices[0].message.content
      }
    }

    return {
      provider: 'DeepSeek分析',
      icon: '',
      content: '暂时无法获取AI分析'
    }
  } catch (error) {
    console.error('DeepSeek API调用失败:', error)
    return {
      provider: 'DeepSeek分析',
      icon: '',
      content: '网络请求失败'
    }
  }
}

// 本地规则分析（备用方案）
function analyzeWithLocalRules(decisions, klineData, stats) {
  const analysis = []

  // 分析买卖时机
  if (stats.winRate > 60) {
    analysis.push('买卖时机把握精准，顺势交易执行良好。')
  } else if (stats.winRate < 40) {
    analysis.push('买卖时机欠佳，建议加强趋势判断训练。')
  } else {
    analysis.push('买卖时机尚可，但仍有提升空间。')
  }

  // 分析风控
  const hasStopLoss = decisions.some((d, i) =>
    i > 0 && d.type === 'sell' && decisions[i-1].type === 'buy' &&
    d.price < decisions[i-1].price * 0.95
  )

  if (hasStopLoss) {
    analysis.push('风控意识良好，能够及时止损。')
  } else if (stats.totalReturn < -20) {
    analysis.push('缺乏止损意识，需要设定明确的止损位。')
  }

  // 改进建议
  if (decisions.length > 15) {
    analysis.push('交易频率过高，建议减少操作频次。')
  } else if (decisions.length < 5) {
    analysis.push('交易过于谨慎，可能错过机会。')
  }

  return {
    provider: '本地分析',
    icon: '',
    content: analysis.join('')
  }
}

// 统一的分析接口（深度分析，用于result页面）
export async function getAIAnalysis(decisions, klineData, stats, stockInfo) {
  const analyses = []

  // 1. DeepSeek 分析
  const deepseekAnalysis = await analyzeWithDeepSeek(decisions, klineData, stats, stockInfo)
  analyses.push(deepseekAnalysis)

  // 2. 本地规则分析
  const localAnalysis = analyzeWithLocalRules(decisions, klineData, stats)
  analyses.push(localAnalysis)

  return analyses
}
