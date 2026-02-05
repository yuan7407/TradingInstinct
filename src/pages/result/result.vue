<template>
  <view class="result-container">
    <view class="bg-spot spot-a"></view>
    <view class="bg-spot spot-b"></view>
    <view class="bg-glow"></view>

    <!-- 破产倒计时蒙层 -->
    <view class="countdown-overlay" v-if="showCountdown">
      <view class="countdown-content">
        <text class="countdown-title">交易结束</text>
        <text class="countdown-subtitle">金币已耗尽</text>
        <view class="countdown-timer">
          <text class="countdown-number">{{ countdownSeconds }}</text>
          <text class="countdown-unit">秒</text>
        </view>
        <text class="countdown-tip">分享给好友可立即继续</text>
        <button class="btn-share-now" open-type="share">
          <text>分享给好友</text>
        </button>
      </view>
    </view>

    <!-- 页面标题 -->
    <view class="page-header">
      <view class="back-btn" @tap="goBack">
        <text class="back-arrow">←</text>
      </view>
      <text class="page-title">AI深度分析</text>
      <view class="placeholder"></view>
    </view>

    <!-- 股票信息揭露 -->
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
          <text class="item-label">交易次数</text>
          <text class="item-value">{{tradeCount}}</text>
        </view>
      </view>
    </view>

    <!-- AI分析 -->
    <scroll-view class="ai-section" scroll-y>
      <view class="ai-title">
        <text>DeepSeek AI 分析</text>
        <view class="loading-indicator" v-if="isLoading">
          <text class="loading-text">分析中...</text>
        </view>
      </view>
      <view v-for="(analysis, idx) in aiAnalyses" :key="idx" class="ai-item">
        <view class="ai-header">
          <text>{{analysis.provider}}</text>
        </view>
        <text class="ai-content">{{analysis.content}}</text>
      </view>
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="bottom-actions">
      <button class="btn-share" open-type="share">
        <text>分享好友</text>
      </button>
      <button class="btn-save" @tap="saveImage">
        <text>保存图片</text>
      </button>
      <button class="btn-back" @tap="goBack" :disabled="showCountdown">
        <text>{{ isBankrupt ? '重新开始' : '继续交易' }}</text>
      </button>
    </view>
  </view>
</template>

<script>
import { getAIAnalysis } from '@/utils/aiAnalysis'

// 破产倒计时配置
const BANKRUPTCY_COUNTDOWN = [15, 30, 45, 60] // 第1/2/3/4+次的倒计时秒数

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
      tradeCount: 0,
      showReveal: false,
      aiAnalyses: [],
      isLoading: true,
      isBankrupt: false,
      // 倒计时相关
      showCountdown: false,
      countdownSeconds: 0,
      countdownTimer: null
    }
  },

  onLoad(options) {
    if (options.data) {
      const data = JSON.parse(decodeURIComponent(options.data))
      this.processGameData(data)
    }
  },

  onShow() {
    setTimeout(() => {
      this.showReveal = true
    }, 300)
  },

  onUnload() {
    this.clearCountdownTimer()
  },

  // 分享配置
  onShareAppMessage() {
    // 分享成功后清零倒计时
    this.onShareSuccess()
    return {
      title: `我在盘感训练中${this.totalReturn >= 0 ? '盈利' : '亏损'}${Math.abs(this.totalReturn).toFixed(1)}%，来挑战！`,
      path: '/pages/welcome/welcome'
    }
  },

  methods: {
    processGameData(data) {
      this.stockData = {
        stockSymbol: data.stockSymbol,
        stockName: data.stockName,
        period: data.period
      }
      this.isBankrupt = data.isBankrupt || false

      // 计算收益
      this.totalReturn = ((data.totalAsset - data.initialAsset) / data.initialAsset * 100)

      // 计算胜率
      let wins = 0
      let totalTrades = 0
      data.decisions.forEach(d => {
        if (d.profit !== undefined) {
          totalTrades++
          if (d.profit > 0) wins++
        }
      })
      this.winRate = totalTrades > 0 ? (wins / totalTrades * 100) : 0
      this.tradeCount = data.decisions.length

      // 计算最大回撤
      this.maxDrawdown = this.calculateMaxDrawdown(data)

      // 如果破产，启动倒计时
      if (this.isBankrupt) {
        this.startBankruptcyCountdown()
      }

      // 生成AI深度分析
      this.generateAIAnalysis(data)
    },

    // 获取今日破产次数
    getTodayBankruptCount() {
      const today = new Date().toDateString()
      const stored = uni.getStorageSync('bankruptData')
      if (stored && stored.date === today) {
        return stored.count
      }
      return 0
    },

    // 增加今日破产次数
    incrementBankruptCount() {
      const today = new Date().toDateString()
      const stored = uni.getStorageSync('bankruptData')
      let count = 1
      if (stored && stored.date === today) {
        count = stored.count + 1
      }
      uni.setStorageSync('bankruptData', { date: today, count })
      return count
    },

    // 启动破产倒计时
    startBankruptcyCountdown() {
      const bankruptCount = this.incrementBankruptCount()
      // 根据破产次数确定倒计时秒数，超过数组长度则取最后一个
      const idx = Math.min(bankruptCount - 1, BANKRUPTCY_COUNTDOWN.length - 1)
      this.countdownSeconds = BANKRUPTCY_COUNTDOWN[idx]
      this.showCountdown = true

      this.countdownTimer = setInterval(() => {
        this.countdownSeconds--
        if (this.countdownSeconds <= 0) {
          this.clearCountdownTimer()
          this.showCountdown = false
        }
      }, 1000)
    },

    // 清除倒计时定时器
    clearCountdownTimer() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer)
        this.countdownTimer = null
      }
    },

    // 分享成功回调
    onShareSuccess() {
      this.clearCountdownTimer()
      this.showCountdown = false
      this.countdownSeconds = 0
    },

    calculateMaxDrawdown(data) {
      const decisions = data.decisions || []
      if (decisions.length === 0) return 0

      let asset = data.initialAsset
      const assetCurve = [asset]

      decisions.forEach(d => {
        if (d.profit !== undefined) {
          asset += d.profit
        } else if (d.amount !== undefined) {
          if (d.type === 'buy' || d.type === 'short') {
            asset -= d.amount
          } else if (d.type === 'sell') {
            asset += d.amount
          }
        }
        assetCurve.push(asset)
      })

      let maxDrawdown = 0
      let peak = assetCurve[0]

      for (const value of assetCurve) {
        if (value > peak) peak = value
        const drawdown = (peak - value) / peak * 100
        if (drawdown > maxDrawdown) maxDrawdown = drawdown
      }

      return maxDrawdown
    },

    async generateAIAnalysis(data) {
      this.isLoading = true

      const stats = {
        totalAsset: data.totalAsset,
        totalReturn: this.totalReturn,
        winRate: this.winRate,
        maxDrawdown: this.maxDrawdown,
        tradeCount: data.decisions.length,
        trend: this.totalReturn > 10 ? '上升' : this.totalReturn < -10 ? '下降' : '震荡'
      }

      try {
        this.aiAnalyses = await getAIAnalysis(data.decisions, data.klineData || [], stats, this.stockData)
      } catch (error) {
        console.error('AI分析失败:', error)
        this.aiAnalyses = [
          {
            provider: '本地分析',
            content: '分析服务暂时不可用，请稍后重试'
          }
        ]
      }

      this.isLoading = false
    },

    // 保存图片到相册
    async saveImage() {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    },

    goRanking() {
      uni.navigateTo({ url: '/pages/ranking/ranking' })
    },

    goBack() {
      if (this.showCountdown) return

      if (this.isBankrupt) {
        uni.redirectTo({ url: '/pages/index/index' })
      } else {
        uni.navigateBack()
      }
    }
  }
}
</script>

<style>
.result-container {
  min-height: 100vh;
  background: radial-gradient(120% 120% at 10% 0%, rgba(27, 45, 64, 0.95), #0b0f1c 58%, #070a14 100%);
  display: flex;
  flex-direction: column;
  padding: 30rpx 28rpx 50rpx;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.bg-spot {
  position: absolute;
  width: 560rpx;
  height: 560rpx;
  border-radius: 50%;
  filter: blur(190rpx);
  opacity: 0.5;
  z-index: 0;
}

.spot-a {
  background: rgba(110, 231, 201, 0.18);
  top: -200rpx;
  left: -140rpx;
}

.spot-b {
  background: rgba(40, 64, 110, 0.45);
  right: -180rpx;
  bottom: -220rpx;
}

.bg-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 70% 0%, rgba(255, 255, 255, 0.12), transparent 45%);
  opacity: 0.4;
  z-index: 0;
}

/* 倒计时蒙层 */
.countdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.countdown-content {
  text-align: center;
  padding: 60rpx 50rpx;
}

.countdown-title {
  display: block;
  color: #ff5b5b;
  font-size: 48rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.countdown-subtitle {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 28rpx;
  margin-bottom: 50rpx;
}

.countdown-timer {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 40rpx;
}

.countdown-number {
  color: #fff;
  font-size: 120rpx;
  font-weight: 700;
  line-height: 1;
}

.countdown-unit {
  color: rgba(255, 255, 255, 0.6);
  font-size: 32rpx;
  margin-left: 10rpx;
}

.countdown-tip {
  display: block;
  color: rgba(255, 255, 255, 0.5);
  font-size: 24rpx;
  margin-bottom: 30rpx;
}

.btn-share-now {
  background: linear-gradient(135deg, #4be3a4, #18c98a);
  color: #04120b;
  font-size: 30rpx;
  font-weight: 600;
  padding: 24rpx 80rpx;
  border-radius: 44rpx;
  box-shadow: 0 16rpx 36rpx rgba(16, 201, 138, 0.35);
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 0 20rpx;
  position: relative;
  z-index: 1;
}

.back-btn {
  padding: 12rpx 20rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12rpx;
}

.back-arrow {
  color: rgba(255, 255, 255, 0.9);
  font-size: 32rpx;
}

.page-title {
  color: #f7fbff;
  font-size: 34rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.placeholder {
  width: 60rpx;
}

.reveal-section {
  text-align: center;
  padding: 30rpx 0 40rpx;
  opacity: 0;
  transform: translateY(-20rpx);
  transition: all 0.8s ease;
  position: relative;
  z-index: 1;
}

.reveal-section.show {
  opacity: 1;
  transform: translateY(0);
}

.stock-symbol {
  display: block;
  color: #f7fbff;
  font-size: 48rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  margin-bottom: 12rpx;
}

.stock-name {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 30rpx;
  margin-bottom: 8rpx;
}

.stock-period {
  display: block;
  color: rgba(160, 176, 208, 0.8);
  font-size: 24rpx;
  letter-spacing: 1rpx;
}

.stats-section {
  background: rgba(12, 18, 32, 0.7);
  border-radius: 24rpx;
  padding: 30rpx 28rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 18rpx 48rpx rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.main-stat {
  text-align: center;
  margin-bottom: 28rpx;
}

.stat-label {
  display: block;
  color: rgba(180, 196, 228, 0.7);
  font-size: 24rpx;
  margin-bottom: 10rpx;
  letter-spacing: 2rpx;
}

.stat-value {
  display: block;
  font-size: 60rpx;
  font-weight: 700;
}

.stat-value.profit {
  color: #00d88a;
}

.stat-value.loss {
  color: #ff5b5b;
}

.sub-stats {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.item-label {
  display: block;
  color: rgba(180, 196, 228, 0.7);
  font-size: 22rpx;
  margin-bottom: 6rpx;
}

.item-value {
  display: block;
  color: #f7fbff;
  font-size: 28rpx;
  font-weight: 600;
}

.ai-section {
  flex: 1;
  background: rgba(12, 18, 32, 0.65);
  border-radius: 22rpx;
  padding: 22rpx;
  min-height: 320rpx;
  max-height: 450rpx;
  margin-bottom: 40rpx;
  width: 100%;
  box-sizing: border-box;
  border: 1rpx solid rgba(255, 255, 255, 0.05);
  position: relative;
  z-index: 1;
}

.ai-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.9);
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
  letter-spacing: 2rpx;
}

.loading-indicator {
  display: flex;
  align-items: center;
}

.loading-text {
  color: #ffd86f;
  font-size: 22rpx;
  font-weight: 400;
}

.ai-item {
  margin-bottom: 16rpx;
  padding: 14rpx;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16rpx;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  border: 1rpx solid rgba(255, 255, 255, 0.04);
}

.ai-header {
  color: rgba(160, 176, 208, 0.85);
  font-size: 22rpx;
  margin-bottom: 6rpx;
}

.ai-content {
  color: rgba(255, 255, 255, 0.9);
  font-size: 24rpx;
  line-height: 1.5;
  display: block;
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
}

.bottom-actions {
  display: flex;
  gap: 14rpx;
  width: 100%;
  box-sizing: border-box;
  padding: 20rpx 8rpx 0;
  margin-top: auto;
  position: relative;
  z-index: 1;
}

.btn-share, .btn-save, .btn-back {
  flex: 1;
  padding: 22rpx 10rpx;
  border-radius: 44rpx;
  font-size: 24rpx;
  font-weight: 600;
  box-sizing: border-box;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.btn-share {
  background: rgba(12, 18, 32, 0.7);
  color: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(110, 231, 201, 0.4);
}

.btn-save {
  background: rgba(12, 18, 32, 0.7);
  color: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(255, 216, 111, 0.4);
}

.btn-back {
  background: linear-gradient(135deg, #4be3a4, #18c98a);
  color: #04120b;
  box-shadow: 0 16rpx 36rpx rgba(16, 201, 138, 0.35);
}

.btn-back[disabled] {
  opacity: 0.5;
}
</style>
