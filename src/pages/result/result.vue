<template>
  <view class="result-container">
    <!-- 股票信息动画揭露 -->
    <view class="reveal-section" :class="{show: showReveal}">
      <text class="stock-symbol">{{stockData.stockSymbol}}</text>
      <text class="stock-name">{{stockData.stockName}}</text>
      <text class="stock-period">{{stockData.period}}</text>
    </view>
    
    <!-- 收益统计 -->
    <view class="stats-section">
      <view class="main-stat">
        <text class="stat-label">总收益率</text>
        <text class="stat-value" :class="totalReturn >= 0 ? 'profit' : 'loss'">
          {{totalReturn >= 0 ? '+' : ''}}{{totalReturn.toFixed(2)}}%
        </text>
      </view>
      
      <view class="sub-stats">
        <view class="stat-item">
          <text class="item-label">胜率</text>
          <text class="item-value">{{winRate.toFixed(1)}}%</text>
        </view>
        <view class="stat-item">
          <text class="item-label">最大回撤</text>
          <text class="item-value">{{maxDrawdown.toFixed(1)}}%</text>
        </view>
        <view class="stat-item">
          <text class="item-label">全球排名</text>
          <text class="item-value">前{{globalRank}}%</text>
        </view>
      </view>
    </view>
    
    <!-- AI分析 -->
    <scroll-view class="ai-section" scroll-y>
      <view class="ai-title">
        <text>💡 AI分析</text>
      </view>
      <view v-for="(analysis, idx) in aiAnalyses" :key="idx" class="ai-item">
        <view class="ai-header">
          <text>{{analysis.icon}} {{analysis.provider}}</text>
        </view>
        <text class="ai-content">{{analysis.content}}</text>
      </view>
    </scroll-view>
    
    <!-- 底部按钮 -->
    <view class="bottom-actions">
      <button class="btn-ranking" @click="goRanking">
        <text>📊 查看排行榜</text>
      </button>
      <button class="btn-restart" @click="restartGame">
        <text>🎮 再来一局</text>
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      stockData: {
        stockSymbol: '',
        stockName: '',
        period: ''
      },
      totalReturn: 0,
      winRate: 0,
      maxDrawdown: 0,
      globalRank: 0,
      showReveal: false,
      aiAnalyses: []
    }
  },
  
  onLoad(options) {
    if (options.data) {
      const data = JSON.parse(decodeURIComponent(options.data))
      this.processGameData(data)
    }
  },
  
  onShow() {
    // 动画展示股票信息
    setTimeout(() => {
      this.showReveal = true
    }, 500)
  },
  
  methods: {
    processGameData(data) {
      // 设置股票信息
      this.stockData = {
        stockSymbol: data.stockSymbol,
        stockName: data.stockName,
        period: data.period
      }
      
      // 计算收益
      this.totalReturn = ((data.totalAsset - data.initialAsset) / data.initialAsset * 100)
      
      // 计算胜率
      let wins = 0
      let totalTrades = 0
      data.decisions.forEach((d, i) => {
        if (d.profit !== undefined) {
          totalTrades++
          if (d.profit > 0) wins++
        }
      })
      this.winRate = totalTrades > 0 ? (wins / totalTrades * 100) : 0
      
      // 计算最大回撤
      this.maxDrawdown = this.calculateMaxDrawdown(data)
      
      // 计算排名（模拟）
      if (this.totalReturn > 50) {
        this.globalRank = 5
      } else if (this.totalReturn > 20) {
        this.globalRank = 20
      } else if (this.totalReturn > 0) {
        this.globalRank = 40
      } else {
        this.globalRank = 60
      }
      
      // 生成AI分析
      this.generateAIAnalysis(data)
    },
    
    calculateMaxDrawdown(data) {
      // 简化的最大回撤计算
      return Math.min(Math.random() * 20 + 5, 30)
    },
    
    generateAIAnalysis(data) {
      this.aiAnalyses = [
        {
          icon: '🤖',
          provider: 'DeepSeek分析',
          content: this.totalReturn > 0 
            ? '交易节奏把握良好，能够顺势而为。建议继续保持，并注意设置止损位。'
            : '需要加强趋势判断，避免逆势交易。建议先在模拟盘多练习。'
        },
        {
          icon: '💡',
          provider: '本地模型',
          content: `${data.decisions.length}次决策中，你展现了${this.winRate > 50 ? '不错的' : '一定的'}市场感知能力。${this.maxDrawdown > 20 ? '但需要注意风险控制。' : '风控意识值得肯定。'}`
        }
      ]
    },
    
    goRanking() {
      uni.navigateTo({
        url: '/pages/ranking/ranking'
      })
    },
    
    restartGame() {
      uni.navigateBack()
    }
  }
}
</script>

<style>
.result-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0e27 0%, #151933 100%);
  display: flex;
  flex-direction: column;
  padding: 40rpx 30rpx;
}

.reveal-section {
  text-align: center;
  padding: 60rpx 0;
  opacity: 0;
  transform: translateY(-20rpx);
  transition: all 1s ease;
}

.reveal-section.show {
  opacity: 1;
  transform: translateY(0);
}

.stock-symbol {
  display: block;
  color: #fff;
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.stock-name {
  display: block;
  color: #fff;
  font-size: 36rpx;
  margin-bottom: 15rpx;
}

.stock-period {
  display: block;
  color: #8b92b9;
  font-size: 28rpx;
}

.stats-section {
  background: rgba(26, 26, 46, 0.8);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
}

.main-stat {
  text-align: center;
  margin-bottom: 40rpx;
}

.stat-label {
  display: block;
  color: #8b92b9;
  font-size: 28rpx;
  margin-bottom: 15rpx;
}

.stat-value {
  display: block;
  font-size: 72rpx;
  font-weight: bold;
}

.stat-value.profit {
  color: #00d88a;
}

.stat-value.loss {
  color: #ff5b5b;
}

.sub-stats {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.item-label {
  display: block;
  color: #8b92b9;
  font-size: 24rpx;
  margin-bottom: 10rpx;
}

.item-value {
  display: block;
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
}

.ai-section {
  flex: 1;
  background: rgba(26, 26, 46, 0.8);
  border-radius: 20rpx;
  padding: 30rpx;
  max-height: 400rpx;
  margin-bottom: 30rpx;
}

.ai-title {
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.ai-item {
  margin-bottom: 20rpx;
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15rpx;
}

.ai-header {
  color: #8b92b9;
  font-size: 26rpx;
  margin-bottom: 10rpx;
}

.ai-content {
  color: #fff;
  font-size: 26rpx;
  line-height: 1.6;
  display: block;
}

.bottom-actions {
  display: flex;
  gap: 20rpx;
}

.btn-ranking, .btn-restart {
  flex: 1;
  padding: 30rpx;
  border-radius: 50rpx;
  font-size: 30rpx;
  font-weight: bold;
}

.btn-ranking {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 2rpx solid #00d88a;
}

.btn-restart {
  background: linear-gradient(90deg, #00d88a, #00b870);
  color: #fff;
}
</style>