// AI分析服务配置
const AI_PROVIDERS = {
    deepseek: {
      name: 'DeepSeek分析',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      apiKey: process.env.VUE_APP_DEEPSEEK_KEY || 'sk-2fe29d38bc024e64bdd8326edc000a99', // 使用环境变量
      model: 'deepseek-chat',
      icon: '🤖'
    },
    
    // 预留其他AI接口
    openai: {
      name: 'GPT分析',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: process.env.VUE_APP_OPENAI_KEY || '',
      model: 'gpt-3.5-turbo',
      icon: '🧠',
      enabled: false // 暂未启用
    },
    
    claude: {
      name: 'Claude分析',
      endpoint: 'https://api.anthropic.com/v1/messages',
      apiKey: process.env.VUE_APP_CLAUDE_KEY || '',
      model: 'claude-3-haiku-20240307',
      icon: '🎓',
      enabled: false // 暂未启用
    },
    
    local: {
      name: '本地模型',
      endpoint: '',
      apiKey: '',
      model: 'local',
      icon: '💡',
      enabled: true // 作为备用
    }
  }
  
  // 生成交易分析提示词
  function generatePrompt(decisions, klineData, stats) {
    return `请分析以下股票交易记录，给出专业的投资建议：
  
  交易数据：
  - 初始资金：10000元
  - 最终资产：${stats.totalAsset}元
  - 总收益率：${stats.totalReturn}%
  - 交易次数：${decisions.length}
  - 胜率：${stats.winRate}%
  
  交易决策记录：
  ${decisions.map((d, i) => `${i+1}. ${d.type === 'buy' ? '买入' : '卖出'} @ ${d.price.toFixed(2)}`).join('\n')}
  
  K线特征：
  - 趋势：${stats.trend}
  - 波动率：${stats.volatility}
  
  请从以下3个方面给出50字以内的精炼分析：
  1. 买卖时机把握
  2. 风险控制能力  
  3. 改进建议
  
  要求：语言简洁专业，直接给出要点，不要客套话。`
  }
  
  // DeepSeek API调用
  async function analyzeWithDeepSeek(decisions, klineData, stats) {
    const provider = AI_PROVIDERS.deepseek
    
    try {
      const response = await uni.request({
        url: provider.endpoint,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        data: {
          model: provider.model,
          messages: [
            {
              role: 'system',
              content: '你是一位专业的量化交易分析师，擅长技术分析和风险评估。'
            },
            {
              role: 'user',
              content: generatePrompt(decisions, klineData, stats)
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        }
      })
      
      if (response.data && response.data.choices) {
        return {
          provider: provider.name,
          icon: provider.icon,
          content: response.data.choices[0].message.content
        }
      }
    } catch (error) {
      console.error('DeepSeek API error:', error)
      return {
        provider: provider.name,
        icon: provider.icon,
        content: '分析服务暂时不可用，请稍后再试。'
      }
    }
  }
  
  // 本地规则分析（备用方案）
  function analyzeWithLocalRules(decisions, klineData, stats) {
    let analysis = []
    
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
      provider: AI_PROVIDERS.local.name,
      icon: AI_PROVIDERS.local.icon,
      content: analysis.join('')
    }
  }
  
  // 统一的分析接口
  export async function getAIAnalysis(decisions, klineData, stats) {
    const analyses = []
    
    // 1. DeepSeek分析
    const deepseekAnalysis = await analyzeWithDeepSeek(decisions, klineData, stats)
    analyses.push(deepseekAnalysis)
    
    // 2. 本地规则分析（立即可用）
    const localAnalysis = analyzeWithLocalRules(decisions, klineData, stats)
    analyses.push(localAnalysis)
    
    // 3. 预留位置：当其他API启用时
    // if (AI_PROVIDERS.openai.enabled) {
    //   const gptAnalysis = await analyzeWithGPT(decisions, klineData, stats)
    //   analyses.push(gptAnalysis)
    // }
    
    return analyses
  }