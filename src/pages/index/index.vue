<template>
  <view class="container" :class="bgClass">
    <view class="bg-spot spot-a"></view>
    <view class="bg-spot spot-b"></view>

    <!-- 顶部栏 -->
    <view class="top-bar">
      <view class="pill">盘感</view>
      <view class="stock-title">
        <text class="stock-name">{{ stockNameDisplay }}</text>
        <text class="stock-meta">{{ stockMetaDisplay }}</text>
      </view>
      <view class="round-chip">
        <text>{{ roundLabel }}</text> 
      </view>
    </view>

    <!-- 信息区：金币、收益率、AI建议 - K线图上方 -->
    <view class="info-section top">
      <view class="info-row">
        <view class="metric">
          <text class="label">当前持仓</text>
          <text class="value">{{ positionText }}</text>
        </view>
        <view class="metric right">
          <text class="label">剩余金币</text>
          <text class="value accent">{{ totalAsset.toFixed(0) }}</text>
        </view>
      </view>
      <view class="info-row">
        <view class="metric">
          <text class="label">本轮收益</text>
          <text class="value" :class="currentReturnClass">{{ currentReturnText }}</text>
        </view>
        <view class="metric right">
          <text class="label">决策次数</text>
          <text class="value">{{ currentDecision }}</text>
        </view>
      </view>
      <!-- AI 建议区 -->
      <view class="ai-hint" v-if="aiSuggestion">
        <text class="ai-label">AI:</text>
        <text class="ai-content">{{ aiSuggestion }}</text>
      </view>
    </view>

    <!-- K线图卡片区域 -->
    <view class="deck">
      <view
        class="chart-card-wrapper"
        :class="cardClass"
        @touchstart="onTouchStart"
        @touchmove.stop.prevent="onTouchMove"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
      >
        <view class="chart-card">
          <!-- 当前价格标签 - 左侧 Robinhood 风格 -->
          <view class="price-tag" v-if="currentPrice > 0">
            <text class="price-tag-value">{{ currentPrice.toFixed(2) }}</text>
          </view>
          <canvas
            type="2d"
            id="klineCanvas"
            class="kline-canvas"
          ></canvas>

          <!-- 买入标签 -->
          <view class="decision-label label-buy" :class="{ 'label-visible': showBuy }">
            <text class="decision-text">买入</text>
          </view>

          <!-- 2X买入标签（长按触发）-->
          <view class="decision-label label-buy-2x" :class="{ 'label-visible': showBuy2x }">
            <text class="decision-text-2x">2X</text>
            <text class="decision-text-sub">重仓买入</text>
          </view>

          <!-- 卖出标签 -->
          <view class="decision-label label-sell" :class="{ 'label-visible': showSell }">
            <text class="decision-text">卖出</text>
          </view>

          <!-- 2X卖出/做空标签（长按触发）-->
          <view class="decision-label label-sell-2x" :class="{ 'label-visible': showSell2x }">
            <text class="decision-text-2x">2X</text>
            <text class="decision-text-sub">重仓做空</text>
          </view>

          <!-- 换股票提示 -->
          <view class="decision-label label-next" :class="{ 'label-visible': showNext }">
            <text class="decision-text-small">下一只</text>
          </view>

          <!-- 跳过本轮提示 -->
          <view class="decision-label label-skip" :class="{ 'label-visible': showSkip }">
            <text class="decision-text-small">跳过</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 时间周期选择器 -->
    <view class="time-period-bar">
      <view
        v-for="key in timePeriodOrder"
        :key="key"
        class="period-btn"
        :class="{ 'period-active': currentPeriod === key }"
        @tap="switchPeriod(key)"
      >
        <text>{{ getPeriodLabel(key) }}</text>
      </view>
    </view>

    <!-- 滑动提示 - 时间周期下方 -->
    <view class="hint bottom">
      <text class="hint-left">← 卖出</text>
      <text class="hint-mid">↑换股 ↓跳过 捏合切周期</text>
      <text class="hint-right">买入 →</text>
    </view>

    <!-- 底部功能按钮 - PICNIC风格小图标 -->
    <view class="action-bar">
      <view class="action-btn" @tap="goToRanking">
        <view class="icon-ranking">
          <view class="bar bar-1"></view>
          <view class="bar bar-2"></view>
          <view class="bar bar-3"></view>
        </view>
        <text class="action-text">排行榜</text>
      </view>
      <view class="action-btn" @tap="shareResult">
        <view class="icon-share">
          <view class="arrow"></view>
          <view class="base"></view>
        </view>
        <text class="action-text">分享</text>
      </view>
      <view class="action-btn" @tap="goToDeepAnalysis">
        <view class="icon-analysis">
          <view class="pulse"></view>
        </view>
        <text class="action-text">AI</text>
      </view>
    </view>

    <!-- 金币奖励弹窗 -->
    <view class="coin-popup-overlay" v-if="showCoinPopup" @tap="dismissCoinPopup">
      <view class="coin-popup" @tap.stop>
        <view class="coin-popup-icon">🪙</view>
        <text class="coin-popup-title">{{ coinPopupTitle }}</text>
        <text class="coin-popup-amount">+{{ coinPopupAmount }}</text>
        <text class="coin-popup-label">金币</text>
        <view class="coin-popup-btn" @tap="dismissCoinPopup">
          <text>开始交易</text>
        </view>
      </view>
    </view>

    <!-- 交易结果弹窗 -->
    <view class="trade-popup" v-if="tradePopup.show" @tap="dismissTradePopup">
      <view class="trade-popup-content">
        <text class="trade-popup-title">{{ tradePopup.title }}</text>
        <view class="trade-popup-lines">
          <text v-for="(line, idx) in tradePopup.lines" :key="idx" class="trade-popup-line">{{ line }}</text>
        </view>
      </view>
    </view>

    <!-- 新手操作指引弹窗 -->
    <view class="guide-popup-overlay" v-if="showGuidePopup" @tap="dismissGuidePopup">
      <view class="guide-popup" @tap.stop>
        <text class="guide-title">操作指引</text>
        <view class="guide-items">
          <view class="guide-item">
            <text class="guide-arrow right">→</text>
            <text class="guide-text">右滑买入</text>
          </view>
          <view class="guide-item">
            <text class="guide-arrow left">←</text>
            <text class="guide-text">左滑卖出</text>
          </view>
          <view class="guide-item">
            <text class="guide-arrow up">↑</text>
            <text class="guide-text">上滑换股</text>
          </view>
          <view class="guide-item">
            <text class="guide-arrow down">↓</text>
            <text class="guide-text">下滑跳过</text>
          </view>
        </view>
        <text class="guide-tip">长按可2倍仓位操作</text>
      </view>
    </view>
  </view>
</template>

<script>
import { GAME_CONFIG, MARKET_RULES, TIME_PERIODS, DEFAULT_TIME_PERIOD, TIME_PERIOD_ORDER } from '@/utils/config'
import { generateMockData, extractGameSegment, getRandomStockInfo, fetchHistoricalData, calculateDateRange } from '@/utils/stockData'
import { getQuickAISuggestion } from '@/utils/aiAnalysis'

export default {
  data() {
    return {
      // 游戏状态
      isInitialized: false,
      isProcessing: false,

      // K线数据
      allKlineData: [],
      visibleKlines: GAME_CONFIG.visibleKlines,
      currentIndex: 20,

      // 交易系统
      currentHolding: 0,
      avgBuyPrice: 0,

      // 记录
      decisions: [],
      totalAsset: uni.getStorageSync('userAsset') || GAME_CONFIG.initialAsset,
      initialAssetThisStock: 0, // 本只股票开始时的资产
      currentStockInfo: null,
      currentDecision: 0, // 当前股票的决策次数

      // AI 建议
      aiSuggestion: '',

      // 触摸状态（只保留方向，用于 CSS 动画）
      swipeDirection: '', // 'buy' | 'sell' | 'next' | 'buy2x' | 'sell2x' | ''

      // 时间周期
      currentPeriod: uni.getStorageSync('preferredPeriod') || DEFAULT_TIME_PERIOD,
      timePeriodOrder: TIME_PERIOD_ORDER,

      // Canvas 缓存（避免重复查询）
      _cachedCanvas: null,
      _cachedCtx: null,
      _cachedDimensions: null,

      // 金币奖励弹窗
      showCoinPopup: false,
      coinPopupType: '', // 'initial' | 'daily'
      coinPopupAmount: 0,
      pendingDailyReward: false, // 标记是否需要在初始金币弹窗后显示每日奖励

      // 交易结果弹窗
      tradePopup: {
        show: false,
        title: '',
        lines: []
      },

      // 新手指引弹窗
      showGuidePopup: false
    }
  },

  computed: {
    stockNameDisplay() {
      return this.currentStockInfo?.name || '随机行情'
    },
    stockMetaDisplay() {
      const symbol = this.currentStockInfo?.symbol || 'RND'
      const market = this.currentStockInfo?.market || 'us'
      const marketLabel = MARKET_RULES[market]?.label || ''
      const period = this.currentStockInfo?.period || '历史片段'
      return `${symbol} · ${marketLabel} · ${period}`
    },
    roundLabel() {
      return `第 ${this.currentDecision} 轮`
    },
    // 当前收益率（现金 + 持仓市值）
    currentReturn() {
      if (!this.initialAssetThisStock) return 0

      // 计算持仓市值
      let positionValue = 0
      const currentPrice = this.allKlineData[this.currentIndex - 1]?.close || 0
      if (this.currentHolding !== 0) {
        if (this.currentHolding > 0) {
          // 多仓：持仓市值
          positionValue = this.currentHolding * currentPrice
        } else {
          // 空仓：保证金价值 + 未实现盈亏
          positionValue = (2 * this.avgBuyPrice - currentPrice) * Math.abs(this.currentHolding)
        }
      }

      const totalValue = this.totalAsset + positionValue
      const returnPct = ((totalValue - this.initialAssetThisStock) / this.initialAssetThisStock) * 100

      // DEBUG: 异常收益率检测
      if (Math.abs(returnPct) > 100) {
        console.log(`[收益率异常] return=${returnPct.toFixed(1)}% | initial=${this.initialAssetThisStock} | totalAsset=${this.totalAsset} | positionValue=${positionValue.toFixed(0)} | holding=${this.currentHolding?.toFixed(2)} | avgBuyPrice=${this.avgBuyPrice?.toFixed(2)} | currentPrice=${currentPrice?.toFixed(2)}`)
      }

      return returnPct
    },
    currentReturnText() {
      const ret = this.currentReturn
      const sign = ret >= 0 ? '+' : ''
      return `${sign}${ret.toFixed(1)}%`
    },
    currentReturnClass() {
      return this.currentReturn >= 0 ? 'positive' : 'negative'
    },
    positionText() {
      if (this.currentHolding > 0) {
        return `多仓 ${this.currentHolding} 股`
      } else if (this.currentHolding < 0) {
        return `做空 ${Math.abs(this.currentHolding)} 股`
      }
      return '无持仓'
    },
    // 当前价格（最新K线收盘价）
    currentPrice() {
      if (!this.allKlineData?.length || this.currentIndex < 1) return 0
      return this.allKlineData[this.currentIndex - 1]?.close || 0
    },

    // 卡片样式类名（不用 computed style，用 CSS 动画）
    cardClass() {
      if (this.swipeDirection === 'buy') return 'card-tilt-right'
      if (this.swipeDirection === 'buy2x') return 'card-tilt-right-2x'
      if (this.swipeDirection === 'sell') return 'card-tilt-left'
      if (this.swipeDirection === 'sell2x') return 'card-tilt-left-2x'
      if (this.swipeDirection === 'next') return 'card-tilt-up'
      if (this.swipeDirection === 'skip') return 'card-tilt-down'
      return ''
    },

    // 背景色类名
    bgClass() {
      if (this.swipeDirection === 'buy' || this.swipeDirection === 'buy2x') return 'bg-buy'
      if (this.swipeDirection === 'sell' || this.swipeDirection === 'sell2x') return 'bg-sell'
      if (this.swipeDirection === 'next' || this.swipeDirection === 'skip') return 'bg-next'
      return ''
    },

    // 标签显示
    showBuy() { return this.swipeDirection === 'buy' },
    showBuy2x() { return this.swipeDirection === 'buy2x' },
    showSell() { return this.swipeDirection === 'sell' },
    showSell2x() { return this.swipeDirection === 'sell2x' },
    showNext() { return this.swipeDirection === 'next' },
    showSkip() { return this.swipeDirection === 'skip' },

    // 金币弹窗标题
    coinPopupTitle() {
      return this.coinPopupType === 'initial' ? '🎉 新手礼包' : '📅 每日签到'
    }
  },

  onReady() {
    if (!this.isInitialized) {
      this.isInitialized = true
      this.checkCoinRewardsAndStart()
    }
  },

  onShow() {
    // 游戏进行中不需要重新读取存储，避免覆盖内存中的正确值
  },

  onUnload() {
    this.isInitialized = false
  },

  methods: {
    // === 金币奖励检查 ===
    checkCoinRewardsAndStart() {
      const isNewUser = !uni.getStorageSync('hasReceivedInitialCoins')
      const today = new Date().toDateString()
      const lastDailyReward = uni.getStorageSync('lastDailyRewardDate')
      const canClaimDaily = lastDailyReward !== today

      if (isNewUser) {
        // 新用户：发放初始金币
        const initialCoins = Math.floor(Math.random() * 20001) + 10000 // 10000-30000
        this.totalAsset = initialCoins
        uni.setStorageSync('userAsset', initialCoins)
        uni.setStorageSync('hasReceivedInitialCoins', true)

        // 显示初始金币弹窗
        this.coinPopupType = 'initial'
        this.coinPopupAmount = initialCoins
        this.showCoinPopup = true

        // 标记需要在之后显示每日奖励（新用户第一天也算签到）
        uni.setStorageSync('lastDailyRewardDate', today)
        this.pendingDailyReward = false // 新用户首日不再单独显示每日签到
      } else if (canClaimDaily) {
        // 老用户每日签到
        const dailyCoins = Math.floor(Math.random() * 15001) + 5000 // 5000-20000
        this.totalAsset = (uni.getStorageSync('userAsset') || 0) + dailyCoins
        uni.setStorageSync('userAsset', this.totalAsset)
        uni.setStorageSync('lastDailyRewardDate', today)

        // 显示每日签到弹窗
        this.coinPopupType = 'daily'
        this.coinPopupAmount = dailyCoins
        this.showCoinPopup = true
      } else {
        // 无奖励，直接开始游戏
        this.checkAndRestoreGame()
      }
    },

    dismissCoinPopup() {
      this.showCoinPopup = false

      if (this.pendingDailyReward) {
        // 如果有待显示的每日奖励，继续显示
        this.pendingDailyReward = false
        const dailyCoins = Math.floor(Math.random() * 15001) + 5000
        this.totalAsset += dailyCoins
        uni.setStorageSync('userAsset', this.totalAsset)

        this.coinPopupType = 'daily'
        this.coinPopupAmount = dailyCoins
        this.showCoinPopup = true
      } else {
        // 所有弹窗显示完毕，开始游戏
        this.checkAndRestoreGame()
      }
    },

    // === 交易结果弹窗 ===
    showTradePopup(title, lines) {
      this.tradePopup = { show: true, title, lines }
      // 4秒后自动消失
      if (this._tradePopupTimer) clearTimeout(this._tradePopupTimer)
      this._tradePopupTimer = setTimeout(() => {
        this.tradePopup.show = false
      }, 4000)
    },

    dismissTradePopup() {
      this.tradePopup.show = false
      if (this._tradePopupTimer) {
        clearTimeout(this._tradePopupTimer)
        this._tradePopupTimer = null
      }
    },

    // === 新手指引弹窗 ===
    showGuideIfFirstTime() {
      const hasSeenGuide = uni.getStorageSync('hasSeenGuide')
      if (!hasSeenGuide) {
        this.showGuidePopup = true
        uni.setStorageSync('hasSeenGuide', true)
        // 3秒后自动消失
        setTimeout(() => {
          this.showGuidePopup = false
        }, 3000)
      }
    },

    dismissGuidePopup() {
      this.showGuidePopup = false
    },

    // === 游戏状态管理 ===
    checkAndRestoreGame() {
      const savedState = uni.getStorageSync('gameState')
      if (savedState) {
        uni.showModal({
          title: '提示',
          content: '检测到未完成的游戏，是否继续？',
          confirmText: '继续',
          cancelText: '新游戏',
          success: (res) => {
            if (res.confirm) {
              this.restoreGameState(JSON.parse(savedState))
            } else {
              uni.removeStorageSync('gameState')
              this.loadNewStock()
            }
          }
        })
      } else {
        this.loadNewStock()
      }
    },

    restoreGameState(state) {
      this.currentStockInfo = state.stockInfo
      this.allKlineData = state.klineData
      this.currentIndex = state.currentIndex
      this.currentDecision = state.currentDecision
      this.currentHolding = state.holding
      this.avgBuyPrice = state.avgBuyPrice
      this.totalAsset = state.totalAsset
      this.initialAssetThisStock = state.initialAssetThisStock
      this.decisions = state.decisions
      this.aiSuggestion = state.aiSuggestion

      // DEBUG: 恢复状态
      console.log(`[恢复游戏] initialAsset=${this.initialAssetThisStock} | totalAsset=${this.totalAsset} | holding=${this.currentHolding} | avgBuyPrice=${this.avgBuyPrice}`)

      this.$nextTick(() => {
        this.drawChart()
      })
    },

    saveGameState() {
      const state = {
        stockInfo: this.currentStockInfo,
        klineData: this.allKlineData,
        currentIndex: this.currentIndex,
        currentDecision: this.currentDecision,
        holding: this.currentHolding,
        avgBuyPrice: this.avgBuyPrice,
        totalAsset: this.totalAsset,
        initialAssetThisStock: this.initialAssetThisStock,
        decisions: this.decisions,
        aiSuggestion: this.aiSuggestion,
        savedAt: Date.now()
      }
      uni.setStorageSync('gameState', JSON.stringify(state))
    },

    // === 触摸事件（极端优化：只更新方向，不更新位置）===
    onTouchStart(e) {
      if (this.isProcessing) return

      // 双指缩放检测
      if (e.touches.length >= 2) {
        this._isPinching = true
        this._pinchStartDistance = this._getPinchDistance(e.touches)
        this._pinchTriggered = false
        this._isDragging = false // 禁用滑动
        return
      }

      const touch = e.touches[0]
      // 非响应式变量（不触发 setData）
      this._startX = touch.clientX
      this._startY = touch.clientY
      this._isDragging = true
      this._isPinching = false
      this._swipeAxis = ''
      this._currentDeltaX = 0
      this._currentDeltaY = 0
      this._holdTimer = null
      this._baseDirection = '' // 基础方向（buy/sell），用于长按升级
      // DEBUG
      this._touchStartTime = Date.now()
      this._moveCount = 0
      this._setDataCount = 0
    },

    onTouchMove(e) {
      // 双指缩放处理
      if (e.touches.length >= 2) {
        // 中途第二根手指加入：从单指升级到双指
        if (!this._isPinching) {
          this._isPinching = true
          this._pinchStartDistance = this._getPinchDistance(e.touches)
          this._pinchTriggered = false
          this._isDragging = false
          this.swipeDirection = ''
          this._baseDirection = ''
          if (this._holdTimer) {
            clearTimeout(this._holdTimer)
            this._holdTimer = null
          }
        }

        if (this._pinchTriggered) return // 已触发，等待 touchend

        const currentDistance = this._getPinchDistance(e.touches)
        const ratio = currentDistance / this._pinchStartDistance

        if (ratio > 1.5) {
          // 张开手指 → zoomIn（更细周期）
          const newPeriod = this._getAdjacentPeriod('zoomIn')
          if (newPeriod) {
            this._pinchTriggered = true
            this.switchPeriodView(newPeriod)
          }
        } else if (ratio < 0.67) {
          // 合拢手指 → zoomOut（更粗周期）
          const newPeriod = this._getAdjacentPeriod('zoomOut')
          if (newPeriod) {
            this._pinchTriggered = true
            this.switchPeriodView(newPeriod)
          }
        }
        return
      }

      if (!this._isDragging || this.isProcessing) return
      const touch = e.touches[0]
      const deltaX = touch.clientX - this._startX
      const deltaY = touch.clientY - this._startY
      this._moveCount++

      // 确定滑动轴向（只判断一次）
      if (!this._swipeAxis && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        this._swipeAxis = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
      }

      // 保存当前位移（用于 touchend 判断）
      this._currentDeltaX = deltaX
      this._currentDeltaY = deltaY

      // 判断基础方向（非响应式）
      let newBaseDirection = ''
      if (this._swipeAxis === 'horizontal') {
        newBaseDirection = deltaX > 30 ? 'buy' : (deltaX < -30 ? 'sell' : '')
      } else if (this._swipeAxis === 'vertical') {
        // 垂直方向需要更长的滑动距离才显示标签
        newBaseDirection = deltaY < -60 ? 'next' : (deltaY > 60 ? 'skip' : '')
      }

      // 2X 状态下检测是否应该降级（距离减小时降级到1X）
      if (this.swipeDirection.includes('2x') && this._swipeAxis === 'horizontal') {
        const threshold2x = 50 // 低于此距离降级
        if (Math.abs(deltaX) < threshold2x) {
          // 降级到1X，重新启动长按计时器
          this._setDataCount++
          this.swipeDirection = this._baseDirection
          uni.vibrateShort({ type: 'light' })
          if (this._holdTimer) {
            clearTimeout(this._holdTimer)
          }
          this._holdTimer = setTimeout(() => {
            if (this._isDragging && (this._baseDirection === 'buy' || this._baseDirection === 'sell')) {
              this._setDataCount++
              this.swipeDirection = this._baseDirection + '2x'
              uni.vibrateShort({ type: 'heavy' })
            }
          }, 600)
        }
      }

      // 方向变化时的处理
      if (newBaseDirection !== this._baseDirection) {
        this._baseDirection = newBaseDirection

        // 清除之前的长按计时器
        if (this._holdTimer) {
          clearTimeout(this._holdTimer)
          this._holdTimer = null
        }

        // 如果是买入或卖出方向，启动长按计时器
        if (newBaseDirection === 'buy' || newBaseDirection === 'sell') {
          // 普通买入/卖出方向确定时，轻微振动反馈
          uni.vibrateShort({ type: 'light' })

          this._holdTimer = setTimeout(() => {
            // 升级到 2X
            if (this._isDragging && this._baseDirection === newBaseDirection) {
              this._setDataCount++
              this.swipeDirection = newBaseDirection + '2x'
              // 2X 重仓：强振动反馈
              uni.vibrateShort({ type: 'heavy' })
            }
          }, 600) // 600ms 后升级到 2X
        }

        // 垂直方向也给振动反馈
        if (newBaseDirection === 'next' || newBaseDirection === 'skip') {
          uni.vibrateShort({ type: 'light' })
        }

        // 更新显示方向（非2X状态时才更新，或方向完全改变时强制更新）
        if (!this.swipeDirection.includes('2x') || newBaseDirection === '' || newBaseDirection === 'next' || newBaseDirection === 'skip') {
          this._setDataCount++
          this.swipeDirection = newBaseDirection
        }
      }
    },

    onTouchEnd() {
      // 双指缩放结束
      if (this._isPinching) {
        this._isPinching = false
        this._pinchStartDistance = 0
        this._pinchTriggered = false
        return
      }

      if (!this._isDragging) return
      this._isDragging = false

      // 清除长按计时器
      if (this._holdTimer) {
        clearTimeout(this._holdTimer)
        this._holdTimer = null
      }

      // DEBUG
      const duration = Date.now() - this._touchStartTime
      console.log(`[触摸结束] 持续=${duration}ms | move次数=${this._moveCount} | setData次数=${this._setDataCount} | direction=${this.swipeDirection} | deltaX=${this._currentDeltaX?.toFixed(0)}`)

      const threshold = 60
      const verticalThreshold = 100  // 垂直方向需要更长距离才触发

      // 判断动作（包括 2X）
      if (this._swipeAxis === 'horizontal') {
        if (this._currentDeltaX > threshold) {
          const is2x = this.swipeDirection === 'buy2x'
          this.makeDecision('buy', is2x ? 2 : 1)
        } else if (this._currentDeltaX < -threshold) {
          const is2x = this.swipeDirection === 'sell2x'
          this.makeDecision('sell', is2x ? 2 : 1)
        }
      } else if (this._swipeAxis === 'vertical') {
        if (this._currentDeltaY < -verticalThreshold) {
          this.switchToNextStock()
        } else if (this._currentDeltaY > verticalThreshold) {
          this.skipTurn()
        }
      }

      // 重置状态
      this.swipeDirection = ''
      this._baseDirection = ''
    },

    // === 股票切换 ===
    async switchToNextStock() {
      if (this.isProcessing) return
      this.isProcessing = true

      // 如果有持仓，自动平仓
      if (this.currentHolding !== 0) {
        this.closePosition()
      }

      // 保存资产并清除游戏状态（开始新股票）
      uni.setStorageSync('userAsset', this.totalAsset)
      uni.removeStorageSync('gameState')

      // 加载新股票
      await this.loadNewStock()
      this.isProcessing = false
    },

    // 平仓当前持仓
    closePosition() {
      if (this.currentHolding === 0) return

      const currentPrice = this.allKlineData[this.currentIndex - 1]?.close
      if (!currentPrice) return

      if (this.currentHolding > 0) {
        // 平多仓
        const sellAmount = Math.round(this.currentHolding * currentPrice)
        const commission = Math.max(1, Math.round(sellAmount * GAME_CONFIG.commissionRate))
        const profit = Math.round((currentPrice - this.avgBuyPrice) * this.currentHolding)
        this.totalAsset += (sellAmount - commission)
        uni.showToast({ title: `平仓 ${profit >= 0 ? '盈利' : '亏损'} ${Math.abs(profit)}`, icon: 'none', duration: 800 })
      } else {
        // 平空仓：买回股票 + 解冻卖出收入 + 退回保证金
        const shares = Math.abs(this.currentHolding)
        const buybackCost = Math.round(currentPrice * shares)
        const commission = Math.max(1, Math.round(buybackCost * GAME_CONFIG.commissionRate))
        const profit = Math.round((this.avgBuyPrice - currentPrice) * shares)
        this.totalAsset = this.totalAsset - buybackCost + 2 * this.avgBuyPrice * shares - commission
        uni.showToast({ title: `平空 ${profit >= 0 ? '盈利' : '亏损'} ${Math.abs(profit)}`, icon: 'none', duration: 800 })
      }

      this.currentHolding = 0
      this.avgBuyPrice = 0
    },

    // 加载新股票
    async loadNewStock() {
      // 清除 Canvas 缓存（切换股票时需要重新初始化）
      this._cachedCanvas = null
      this._cachedCtx = null
      this._cachedDimensions = null

      uni.showLoading({ title: '加载中...' })

      try {
        // 获取当前时间周期配置
        const dateRange = calculateDateRange(this.currentPeriod)
        const periodConfig = TIME_PERIODS[this.currentPeriod]

        // 随机选择一只股票
        const stockInfo = getRandomStockInfo()

        // 使用时间周期参数获取数据
        const data = await fetchHistoricalData(
          stockInfo.symbol,
          dateRange.startDate,
          dateRange.endDate,
          {
            multiplier: dateRange.multiplier,
            timespan: dateRange.timespan
          }
        )

        if (data?.length) {
          this.allKlineData = extractGameSegment(data)
          this.currentStockInfo = {
            symbol: stockInfo.symbol,
            name: stockInfo.name,
            market: stockInfo.market || 'us',
            period: `${periodConfig.label} · ${dateRange.timespan}`,
            description: stockInfo.description
          }
        } else {
          // API 无数据时使用 mock
          this.allKlineData = generateMockData()
          this.currentStockInfo = {
            ...stockInfo,
            period: `${periodConfig.label} · 模拟`
          }
        }
      } catch (error) {
        console.error('[Game] loadNewStock error:', error)
        this.allKlineData = generateMockData()
        const stockInfo = getRandomStockInfo()
        this.currentStockInfo = {
          ...stockInfo,
          period: `${TIME_PERIODS[this.currentPeriod]?.label || ''} · 模拟`
        }
      }

      // 重置状态
      this.currentIndex = 20
      this.currentDecision = 0
      this.decisions = []
      this.currentHolding = 0
      this.avgBuyPrice = 0
      this.initialAssetThisStock = this.totalAsset
      this.aiSuggestion = ''

      // DEBUG: 新股票初始资产
      console.log(`[新股票] initialAsset=${this.initialAssetThisStock} | stock=${this.currentStockInfo?.symbol} | period=${this.currentPeriod}`)

      uni.hideLoading()

      this.$nextTick(() => {
        this.drawChart()
        this.showGuideIfFirstTime()
      })
    },

    // === 交易决策 ===
    makeDecision(decision, multiplier = 1) {
      if (this.isProcessing) return

      // 检查K线是否已到末尾
      if (this.currentIndex >= this.allKlineData.length - 10) {
        // 自动平仓
        if (this.currentHolding !== 0) {
          this.closePosition()
        }
        uni.showToast({ title: '本股票行情已结束，上滑换股', icon: 'none', duration: 2000 })
        return
      }

      this.isProcessing = true
      const currentPrice = this.allKlineData[this.currentIndex - 1].close

      if (decision === 'buy') {
        this.handleBuy(currentPrice, multiplier)
      } else {
        this.handleSell(currentPrice, multiplier)
      }
    },

    handleBuy(currentPrice, multiplier = 1) {
      if (this.totalAsset < GAME_CONFIG.minAsset) {
        this.handleBankrupt()
        return
      }

      // 如果持有空仓，先平空
      if (this.currentHolding < 0) {
        this.coverShort(currentPrice)
        return
      }

      const riskPercent = GAME_CONFIG.tradeRiskPercent * multiplier
      const budget = Math.round(this.totalAsset * riskPercent)
      const sharesToBuy = Math.max(1, Math.floor(budget / currentPrice))
      const tradeAmount = Math.round(sharesToBuy * currentPrice)
      const commission = Math.max(1, Math.round(tradeAmount * GAME_CONFIG.commissionRate))
      const multiplierText = multiplier > 1 ? `${multiplier}X ` : ''
      const stockName = this.currentStockInfo?.name || '股票'
      const isAddPosition = this.currentHolding > 0

      if (isAddPosition) {
        // 加仓：加权平均成本
        const totalCost = this.avgBuyPrice * this.currentHolding + currentPrice * sharesToBuy
        this.currentHolding += sharesToBuy
        this.avgBuyPrice = totalCost / this.currentHolding
      } else {
        // 新建仓
        this.currentHolding = sharesToBuy
        this.avgBuyPrice = currentPrice
      }

      this.totalAsset -= (tradeAmount + commission)
      this.decisions.push({
        type: 'buy',
        price: currentPrice,
        shares: sharesToBuy,
        amount: tradeAmount,
        multiplier: multiplier,
        index: this.currentIndex - 1
      })

      // 显示交易弹窗
      const title = isAddPosition ? `${multiplierText}加仓成功` : `${multiplierText}买入成功`
      this.showTradePopup(title, [
        `${stockName} ${sharesToBuy} 股`,
        `花费 ${tradeAmount} + 手续费 ${commission}`,
        `当前持仓 ${this.currentHolding} 股`
      ])

      this.advanceChart()
    },

    handleSell(currentPrice, multiplier = 1) {
      const stockName = this.currentStockInfo?.name || '股票'

      if (this.currentHolding > 0) {
        // 平多仓
        const soldShares = this.currentHolding
        const sellAmount = Math.round(soldShares * currentPrice)
        const commission = Math.max(1, Math.round(sellAmount * GAME_CONFIG.commissionRate))
        const profit = Math.round((currentPrice - this.avgBuyPrice) * soldShares)

        this.totalAsset += (sellAmount - commission)
        this.decisions.push({
          type: 'sell',
          price: currentPrice,
          shares: soldShares,
          amount: sellAmount,
          profit: profit,
          index: this.currentIndex - 1
        })

        this.currentHolding = 0
        this.avgBuyPrice = 0

        // 显示交易弹窗
        const profitText = profit >= 0 ? `盈利 ${profit} 金币` : `亏损 ${Math.abs(profit)} 金币`
        this.showTradePopup('卖出平仓', [
          `${stockName} ${soldShares} 股`,
          `${profitText}（手续费 ${commission}）`,
          '当前无持仓'
        ])
      } else if (this.currentHolding === 0) {
        // 开空仓 - 检查市场是否允许做空
        const market = this.currentStockInfo?.market || 'us'
        if (!MARKET_RULES[market]?.canShort) {
          const marketLabel = MARKET_RULES[market]?.label || market
          uni.showToast({ title: `${marketLabel}不支持做空`, icon: 'none', duration: 1500 })
          this.isProcessing = false
          return
        }

        if (this.totalAsset < GAME_CONFIG.minAsset) {
          this.handleBankrupt()
          return
        }

        const riskPercent = GAME_CONFIG.tradeRiskPercent * multiplier
        const budget = Math.round(this.totalAsset * riskPercent)
        const sharesToShort = Math.max(1, Math.floor(budget / currentPrice))
        const tradeAmount = Math.round(sharesToShort * currentPrice)
        const commission = Math.max(1, Math.round(tradeAmount * GAME_CONFIG.commissionRate))
        const multiplierText = multiplier > 1 ? `${multiplier}X ` : ''

        this.currentHolding = -sharesToShort
        this.avgBuyPrice = currentPrice
        this.totalAsset -= (tradeAmount + commission)

        this.decisions.push({
          type: 'short',
          price: currentPrice,
          shares: sharesToShort,
          amount: tradeAmount,
          multiplier: multiplier,
          index: this.currentIndex - 1
        })

        // 显示交易弹窗
        this.showTradePopup(`${multiplierText}做空成功`, [
          `${stockName} ${sharesToShort} 股`,
          `保证金 ${tradeAmount} + 手续费 ${commission}`,
          `做空 ${Math.abs(this.currentHolding)} 股`
        ])
      } else {
        // 加空 - 需要检查资金
        if (this.totalAsset < GAME_CONFIG.minAsset) {
          this.handleBankrupt()
          return
        }

        const riskPercent = GAME_CONFIG.tradeRiskPercent * multiplier
        const budget = Math.round(this.totalAsset * riskPercent)
        const sharesToShort = Math.max(1, Math.floor(budget / currentPrice))
        const tradeAmount = Math.round(sharesToShort * currentPrice)
        const commission = Math.max(1, Math.round(tradeAmount * GAME_CONFIG.commissionRate))
        const multiplierText = multiplier > 1 ? `${multiplier}X ` : ''

        // 加权平均做空价格
        const totalSellValue = this.avgBuyPrice * Math.abs(this.currentHolding) + currentPrice * sharesToShort
        this.currentHolding -= sharesToShort
        this.avgBuyPrice = totalSellValue / Math.abs(this.currentHolding)
        this.totalAsset -= (tradeAmount + commission)

        this.decisions.push({
          type: 'short',
          price: currentPrice,
          shares: sharesToShort,
          amount: tradeAmount,
          multiplier: multiplier,
          index: this.currentIndex - 1
        })

        // 显示交易弹窗
        this.showTradePopup(`${multiplierText}加空成功`, [
          `${stockName} ${sharesToShort} 股`,
          `保证金 ${tradeAmount} + 手续费 ${commission}`,
          `做空 ${Math.abs(this.currentHolding)} 股`
        ])
      }

      this.advanceChart()
    },

    coverShort(currentPrice) {
      const stockName = this.currentStockInfo?.name || '股票'
      const shares = Math.abs(this.currentHolding)
      const buybackCost = Math.round(currentPrice * shares)
      const commission = Math.max(1, Math.round(buybackCost * GAME_CONFIG.commissionRate))
      const profit = Math.round((this.avgBuyPrice - currentPrice) * shares)

      // 平空：买回股票 + 解冻卖出收入 + 退回保证金 - 手续费
      this.totalAsset = this.totalAsset - buybackCost + 2 * this.avgBuyPrice * shares - commission

      this.decisions.push({
        type: 'cover',
        price: currentPrice,
        profit: profit,
        shares: shares,
        index: this.currentIndex - 1
      })

      this.currentHolding = 0
      this.avgBuyPrice = 0

      // 显示交易弹窗
      const profitText = profit >= 0 ? `盈利 ${profit} 金币` : `亏损 ${Math.abs(profit)} 金币`
      this.showTradePopup('平空成功', [
        `${stockName} ${shares} 股`,
        `${profitText}（手续费 ${commission}）`,
        '当前无持仓'
      ])

      this.isProcessing = false
    },

    handleBankrupt() {
      // 金币不足，强制平仓后跳转到AI分析结算页面
      const stockInfo = this.currentStockInfo || { symbol: 'RANDOM', name: '模拟数据', period: '随机生成' }

      // 如果有持仓，先强制平仓
      if (this.currentHolding !== 0) {
        this.closePosition()
      }

      // 计算最终收益率
      const finalReturn = ((this.totalAsset - this.initialAssetThisStock) / this.initialAssetThisStock) * 100

      // 清除游戏状态并重置金币，避免恢复到破产状态导致死循环
      uni.removeStorageSync('gameState')
      uni.setStorageSync('userAsset', GAME_CONFIG.initialAsset)

      uni.showToast({ title: '金币不足，进入结算', icon: 'none', duration: 1000 })

      setTimeout(() => {
        uni.redirectTo({
          url: `/pages/result/result?data=${encodeURIComponent(JSON.stringify({
            decisions: this.decisions,
            totalAsset: this.totalAsset,
            initialAsset: this.initialAssetThisStock,
            finalReturn: finalReturn,
            stockSymbol: stockInfo.symbol,
            stockName: stockInfo.name,
            period: stockInfo.period,
            description: stockInfo.description,
            klineData: this.allKlineData.slice(0, this.currentIndex),
            isBankrupt: true
          }))}`
        })
      }, 800)
    },

    // 跳过本轮（不操作，只推进K线）
    skipTurn() {
      if (this.isProcessing) return

      // 检查K线是否已到末尾
      if (this.currentIndex >= this.allKlineData.length - 10) {
        uni.showToast({ title: '本股票行情已结束，上滑换股', icon: 'none', duration: 2000 })
        return
      }

      this.isProcessing = true
      uni.showToast({ title: '跳过本轮', icon: 'none', duration: 500 })
      this.advanceChart(false)
    },

    advanceChart(generateAI = true) {
      setTimeout(() => {
        // 计算推进步数
        const recentKlines = this.allKlineData.slice(
          Math.max(0, this.currentIndex - 5),
          this.currentIndex
        )

        let volatility = 0
        if (recentKlines.length > 1) {
          const changes = recentKlines.map((k, i) => {
            if (i === 0) return 0
            return Math.abs((k.close - recentKlines[i - 1].close) / recentKlines[i - 1].close)
          })
          volatility = changes.reduce((a, b) => a + b, 0) / changes.length
        }

        const minStep = 3
        const maxStep = 8
        const normalizedVol = Math.min(volatility / 0.06, 1)
        const baseStep = Math.round(minStep + (maxStep - minStep) * normalizedVol)
        const jitter = Math.floor(Math.random() * 2)
        const advanceSteps = Math.min(maxStep, Math.max(minStep, baseStep + jitter))

        this.currentIndex = Math.min(this.currentIndex + advanceSteps, this.allKlineData.length - 10)
        this.currentDecision++
        this.drawChart()

        // 生成AI建议（跳过时不生成）
        if (generateAI) {
          this.generateAISuggestion()
        } else {
          this.aiSuggestion = ''
        }

        // 保存游戏状态（包含资产）
        this.saveGameState()
        uni.setStorageSync('userAsset', this.totalAsset)

        this.isProcessing = false
      }, 100)
    },

    // === AI建议（本地规则） ===
    generateAISuggestion() {
      const lastDecision = this.decisions[this.decisions.length - 1]
      if (!lastDecision) return

      const suggestion = getQuickAISuggestion(
        this.allKlineData,
        this.currentIndex,
        lastDecision,
        this.decisions
      )
      this.aiSuggestion = suggestion
    },

    // === 绘制K线图 ===
    drawChart() {
      // 使用缓存的 Canvas，避免重复查询（真机上查询需要 250ms+）
      if (this._cachedCanvas && this._cachedCtx && this._cachedDimensions) {
        this._renderKlines(this._cachedCanvas, this._cachedCtx, this._cachedDimensions)
        return
      }

      // 首次查询并缓存
      const query = uni.createSelectorQuery().in(this)
      query.select('#klineCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res?.[0]?.node) return

          const canvas = res[0].node
          const ctx = canvas.getContext('2d')

          let dpr = 2
          let screenWidth = 375
          try {
            const windowInfo = uni.getWindowInfo()
            dpr = windowInfo.pixelRatio || 2
            screenWidth = windowInfo.windowWidth || 375
          } catch (e) {}

          const rpxRatio = screenWidth / 750
          let width = res[0].width
          let height = res[0].height

          if (width <= 300 || height <= 150) {
            // CSS 中宽度固定 710rpx，高度按比例估算
            width = Math.round(710 * rpxRatio)
            height = Math.round(width * 1.24)
          }

          canvas.width = width * dpr
          canvas.height = height * dpr
          ctx.scale(dpr, dpr)

          // 缓存 Canvas 引用和尺寸
          this._cachedCanvas = canvas
          this._cachedCtx = ctx
          this._cachedDimensions = { width, height, dpr }

          this._renderKlines(canvas, ctx, this._cachedDimensions)
        })
    },

    // 实际渲染 K 线（分离出来复用）
    _renderKlines(canvas, ctx, dimensions) {
      const { width, height } = dimensions

      // 背景
      ctx.fillStyle = '#121328'
      ctx.fillRect(0, 0, width, height)

      if (!this.allKlineData?.length) return

      const gapBars = 4
      const renderCount = Math.max(1, this.visibleKlines - gapBars)
      const startIdx = Math.max(0, this.currentIndex - renderCount)
      const endIdx = this.currentIndex
      const visibleData = this.allKlineData.slice(startIdx, endIdx)

      if (!visibleData.length) return

      const prices = visibleData.flatMap(k => [k.high, k.low])
      const minPrice = Math.min(...prices) * 0.95
      const maxPrice = Math.max(...prices) * 1.05
      const priceRange = maxPrice - minPrice || 1
      const y = (p) => height - ((p - minPrice) / priceRange * height)

      // 网格
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      ctx.lineWidth = 1
      for (let i = 1; i < 5; i++) {
        const pos = (height / 5) * i
        ctx.beginPath()
        ctx.moveTo(0, pos)
        ctx.lineTo(width, pos)
        ctx.stroke()
      }

      // K线
      const barWidth = width / this.visibleKlines
      visibleData.forEach((k, index) => {
        const x = index * barWidth + barWidth / 2
        const isUp = k.close >= k.open
        const color = isUp ? '#4BE3A4' : '#FF6B6B'

        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, y(k.high))
        ctx.lineTo(x, y(k.low))
        ctx.stroke()

        const bodyTop = y(Math.max(k.open, k.close))
        const bodyBottom = y(Math.min(k.open, k.close))
        const bodyHeight = Math.max(bodyBottom - bodyTop, 1)

        if (isUp) {
          ctx.fillStyle = '#121328'
          ctx.fillRect(x - barWidth / 3, bodyTop, barWidth * 2 / 3, bodyHeight)
          ctx.strokeStyle = '#4BE3A4'
          ctx.lineWidth = 1.5
          ctx.strokeRect(x - barWidth / 3, bodyTop, barWidth * 2 / 3, bodyHeight)
        } else {
          ctx.fillStyle = '#FF6B6B'
          ctx.fillRect(x - barWidth / 3, bodyTop, barWidth * 2 / 3, bodyHeight)
        }
      })

      // 交易标记
      this.decisions.forEach(d => {
        if (d.index >= startIdx && d.index < endIdx) {
          const markerX = (d.index - startIdx) * barWidth + barWidth / 2
          const kline = this.allKlineData[d.index]
          if (!kline) return

          const markerY = y(kline.high) - 12
          ctx.fillStyle = d.type === 'buy' ? '#4BE3A4' : '#FF6B6B'
          ctx.beginPath()
          ctx.arc(markerX, markerY, 5, 0, 2 * Math.PI)
          ctx.fill()

          ctx.fillStyle = '#fff'
          ctx.font = '9px sans-serif'
          const label = d.type === 'buy' ? '买' : (d.type === 'sell' ? '卖' : '空')
          ctx.fillText(label, markerX - 4, markerY + 3)
        }
      })

    },

    // === 时间周期切换 ===
    getPeriodLabel(key) {
      return TIME_PERIODS[key]?.label || key
    },

    async switchPeriod(periodKey) {
      if (periodKey === this.currentPeriod) return
      if (this.isProcessing) return
      await this.switchPeriodView(periodKey)
    },

    // 无缝切换周期：保留同一只股票 + 持仓状态
    async switchPeriodView(periodKey) {
      if (periodKey === this.currentPeriod) return
      this.isProcessing = true

      const oldPeriod = this.currentPeriod
      console.log(`[切换周期] ${oldPeriod} -> ${periodKey}`)

      // 更新周期
      this.currentPeriod = periodKey
      uni.setStorageSync('preferredPeriod', periodKey)

      // 如果没有当前股票（首次加载），fallback 到 loadNewStock
      if (!this.currentStockInfo) {
        await this.loadNewStock()
        this.isProcessing = false
        return
      }

      uni.showLoading({ title: '切换周期...' })

      try {
        const dateRange = calculateDateRange(periodKey)
        const periodConfig = TIME_PERIODS[periodKey]

        const data = await fetchHistoricalData(
          this.currentStockInfo.symbol,
          dateRange.startDate,
          dateRange.endDate,
          {
            multiplier: dateRange.multiplier,
            timespan: dateRange.timespan
          }
        )

        if (data?.length) {
          this.allKlineData = extractGameSegment(data)
        } else {
          this.allKlineData = generateMockData()
        }

        // 更新股票信息中的周期显示
        this.currentStockInfo = {
          ...this.currentStockInfo,
          period: `${periodConfig.label} · ${dateRange.timespan}`
        }
      } catch (error) {
        console.error('[Game] switchPeriodView error:', error)
        this.allKlineData = generateMockData()
        this.currentStockInfo = {
          ...this.currentStockInfo,
          period: `${TIME_PERIODS[periodKey]?.label || ''} · 模拟`
        }
      }

      // 重置 K线 位置和决策记录（旧索引无效），但保留持仓和资产
      this.currentIndex = 20
      this.decisions = []
      this.currentDecision = 0
      this.aiSuggestion = ''

      // 清除 Canvas 缓存，重新渲染
      this._cachedCanvas = null
      this._cachedCtx = null
      this._cachedDimensions = null

      uni.hideLoading()

      // 振动反馈
      uni.vibrateShort({ type: 'light' })

      this.$nextTick(() => {
        this.drawChart()
      })

      // 保存游戏状态
      this.saveGameState()

      this.isProcessing = false
    },

    // === 双指缩放辅助 ===
    _getPinchDistance(touches) {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    },

    _getAdjacentPeriod(direction) {
      const order = TIME_PERIOD_ORDER
      const idx = order.indexOf(this.currentPeriod)
      if (idx === -1) return null
      if (direction === 'zoomIn' && idx > 0) return order[idx - 1]
      if (direction === 'zoomOut' && idx < order.length - 1) return order[idx + 1]
      return null
    },

    // === 功能按钮 ===
    goToRanking() {
      uni.navigateTo({ url: '/pages/ranking/ranking' })
    },

    shareResult() {
      // 微信小程序分享
      uni.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      })
    },

    goToDeepAnalysis() {
      // 跳转到深度分析页面（result页面）
      const stockInfo = this.currentStockInfo || { symbol: 'RANDOM', name: '模拟数据', period: '随机生成' }

      uni.navigateTo({
        url: `/pages/result/result?data=${encodeURIComponent(JSON.stringify({
          decisions: this.decisions,
          totalAsset: this.totalAsset,
          initialAsset: this.initialAssetThisStock,
          stockSymbol: stockInfo.symbol,
          stockName: stockInfo.name,
          period: stockInfo.period,
          description: stockInfo.description,
          klineData: this.allKlineData.slice(0, this.currentIndex),
          isDeepAnalysis: true
        }))}`
      })
    }
  }
}
</script>

<style>
.container {
  height: 100vh;
  background: radial-gradient(120% 120% at 8% 0%, rgba(27, 45, 64, 0.95), #0b0f1c 55%, #070a14 100%);
  padding: 16rpx 28rpx 16rpx;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  transition: background 0.2s ease-out;
}

/* 滑动方向背景色 - 使用预定义类避免动态计算渐变 */
.container.bg-buy {
  background: radial-gradient(120% 120% at 8% 0%, rgba(27, 80, 50, 1), rgba(11, 40, 20, 1) 55%, rgba(7, 20, 10, 1) 100%);
}

.container.bg-sell {
  background: radial-gradient(120% 120% at 8% 0%, rgba(80, 27, 27, 1), rgba(40, 11, 11, 1) 55%, rgba(20, 7, 7, 1) 100%);
}

.container.bg-next {
  background: radial-gradient(120% 120% at 8% 0%, rgba(40, 40, 80, 1), rgba(20, 20, 50, 1) 55%, rgba(10, 10, 30, 1) 100%);
}

.bg-spot {
  position: absolute;
  width: 620rpx;
  height: 620rpx;
  border-radius: 50%;
  filter: blur(200rpx);
  opacity: 0.55;
  z-index: 0;
}

.spot-a {
  background: rgba(110, 231, 201, 0.18);
  top: -200rpx;
  left: -160rpx;
}

.spot-b {
  background: rgba(40, 64, 110, 0.45);
  right: -200rpx;
  bottom: -220rpx;
}

.top-bar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  color: rgba(216, 222, 255, 0.92);
  flex-shrink: 0;
}

.pill {
  padding: 8rpx 16rpx;
  background: rgba(12, 18, 34, 0.7);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 999rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 3rpx;
}

.stock-title {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.stock-name {
  color: #f7fbff;
  font-size: 32rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.stock-meta {
  color: rgba(160, 176, 208, 0.85);
  font-size: 22rpx;
}

.round-chip {
  padding: 8rpx 16rpx;
  background: linear-gradient(135deg, rgba(75, 227, 164, 0.28), rgba(255, 255, 255, 0.04));
  border-radius: 999rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
}

.deck {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: visible;
}

/* 当前价格标签 - Robinhood 风格，左侧显示 */
.price-tag {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 30;
  display: flex;
  align-items: center;
  padding: 6rpx 12rpx;
  background: rgba(255, 216, 111, 0.95);
  border-radius: 0 8rpx 8rpx 0;
}

.price-tag::after {
  content: '';
  position: absolute;
  right: -40rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 40rpx;
  height: 2rpx;
  background: rgba(255, 216, 111, 0.6);
}

.price-tag-value {
  color: #0a0e27;
  font-size: 24rpx;
  font-weight: 700;
  font-family: 'SF Mono', 'Menlo', monospace;
}

.chart-card-wrapper {
  position: relative;
  z-index: 10;
  width: 710rpx;
  height: 100%;
  will-change: transform;
  transform-origin: center bottom;
  /* 回弹动画：弹性曲线，有轻微过冲感 */
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 卡片倾斜动画（CSS-only，不需要 JS 更新位置）*/
/* 倾斜状态：快速响应，跟手感 */
.chart-card-wrapper.card-tilt-right {
  transform: translateX(60px) rotate(8deg);
  transition: transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.chart-card-wrapper.card-tilt-right-2x {
  transform: translateX(100px) rotate(14deg);
  transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.chart-card-wrapper.card-tilt-left {
  transform: translateX(-60px) rotate(-8deg);
  transition: transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.chart-card-wrapper.card-tilt-left-2x {
  transform: translateX(-100px) rotate(-14deg);
  transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.chart-card-wrapper.card-tilt-up {
  transform: translateY(-50px);
  transition: transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.chart-card-wrapper.card-tilt-down {
  transform: translateY(50px);
  transition: transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.chart-card {
  position: relative;
  width: 710rpx;
  height: 100%;
  border-radius: 28rpx;
  overflow: hidden;
  background: radial-gradient(circle at 20% 10%, rgba(30, 42, 78, 0.9), rgba(9, 12, 24, 0.98));
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.45);
}

.kline-canvas {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 26rpx;
}

/* 决策标签 */
.decision-label {
  position: absolute;
  top: 50%;
  transform: translateY(-50%) scale(0.9);
  padding: 16rpx 24rpx;
  border-radius: 14rpx;
  pointer-events: none;
  z-index: 100;
  opacity: 0;
  transition: opacity 0.15s ease-out, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.decision-label.label-visible {
  opacity: 1;
  transform: translateY(-50%) scale(1);
}

.label-buy {
  left: 24rpx;
  background: rgba(69, 224, 160, 0.15);
  border: 3rpx solid #45e0a0;
}

.label-buy-2x {
  left: 24rpx;
  background: rgba(69, 224, 160, 0.25);
  border: 4rpx solid #45e0a0;
  box-shadow: 0 0 24rpx rgba(69, 224, 160, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.label-buy-2x.label-visible {
  animation: pulse-green 0.8s ease-in-out infinite;
}

.label-sell {
  right: 24rpx;
  background: rgba(255, 107, 107, 0.15);
  border: 3rpx solid #ff6b6b;
}

.label-sell-2x {
  right: 24rpx;
  background: rgba(255, 107, 107, 0.25);
  border: 4rpx solid #ff6b6b;
  box-shadow: 0 0 24rpx rgba(255, 107, 107, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.label-sell-2x.label-visible {
  animation: pulse-red 0.8s ease-in-out infinite;
}

.label-next {
  left: 50%;
  top: 40rpx;
  bottom: auto;
  transform: translateX(-50%);
  background: rgba(100, 100, 200, 0.2);
  border: 3rpx solid rgba(150, 150, 255, 0.6);
}

.label-skip {
  left: 50%;
  bottom: 40rpx;
  top: auto;
  transform: translateX(-50%);
  background: rgba(150, 150, 100, 0.2);
  border: 3rpx solid rgba(200, 200, 150, 0.6);
}

.decision-text {
  font-size: 56rpx;
  font-weight: 900;
  letter-spacing: 4rpx;
}

.decision-text-small {
  font-size: 36rpx;
  font-weight: 700;
  color: rgba(200, 200, 255, 0.9);
}

.label-buy .decision-text {
  color: #45e0a0;
  text-shadow: 0 0 16rpx rgba(69, 224, 160, 0.8);
}

.label-sell .decision-text {
  color: #ff6b6b;
  text-shadow: 0 0 16rpx rgba(255, 107, 107, 0.8);
}

/* 2X 标签文字样式 */
.decision-text-2x {
  font-size: 64rpx;
  font-weight: 900;
  letter-spacing: 2rpx;
}

.decision-text-sub {
  font-size: 24rpx;
  font-weight: 600;
  opacity: 0.9;
}

.label-buy-2x .decision-text-2x,
.label-buy-2x .decision-text-sub {
  color: #45e0a0;
  text-shadow: 0 0 16rpx rgba(69, 224, 160, 0.8);
}

.label-sell-2x .decision-text-2x,
.label-sell-2x .decision-text-sub {
  color: #ff6b6b;
  text-shadow: 0 0 16rpx rgba(255, 107, 107, 0.8);
}

/* 信息区 */
.info-section {
  position: relative;
  z-index: 1;
  background: rgba(12, 18, 32, 0.65);
  border: 1rpx solid rgba(255, 255, 255, 0.06);
  border-radius: 20rpx;
  padding: 14rpx 20rpx;
  flex-shrink: 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.metric.right {
  align-items: flex-end;
}

.label {
  color: rgba(180, 196, 228, 0.65);
  font-size: 22rpx;
}

.value {
  color: #f7fbff;
  font-size: 28rpx;
  font-weight: 700;
}

.value.accent {
  color: #ffd86f;
}

.value.positive {
  color: #4BE3A4;
}

.value.negative {
  color: #FF6B6B;
}

/* AI建议区 */
.ai-hint {
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.06);
  display: flex;
  gap: 8rpx;
  align-items: flex-start;
}

.ai-label {
  color: #ffd86f;
  font-size: 22rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.ai-content {
  color: rgba(220, 230, 255, 0.85);
  font-size: 22rpx;
  line-height: 1.4;
}

/* 滑动提示 */
.hint {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 16rpx;
  color: rgba(180, 196, 228, 0.6);
  font-size: 22rpx;
  flex-shrink: 0;
}

.hint.bottom {
  background: rgba(12, 18, 32, 0.5);
  border-radius: 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.06);
}

.hint-left {
  color: #ff6b6b;
  font-weight: 600;
}

.hint-mid {
  color: rgba(150, 150, 200, 0.8);
}

.hint-right {
  color: #4be3a4;
  font-weight: 600;
}

/* 底部功能按钮 - 放大版 */
.action-bar {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 12rpx 40rpx;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  transition: opacity 0.2s;
}

.action-btn:active {
  opacity: 0.6;
}

.action-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 24rpx;
  font-weight: 500;
  letter-spacing: 1rpx;
}

/* 排行榜图标 - 三个柱状条 */
.icon-ranking {
  display: flex;
  align-items: flex-end;
  gap: 6rpx;
  height: 48rpx;
}

.icon-ranking .bar {
  width: 10rpx;
  background: rgba(255, 255, 255, 0.65);
  border-radius: 3rpx;
}

.icon-ranking .bar-1 { height: 22rpx; }
.icon-ranking .bar-2 { height: 36rpx; }
.icon-ranking .bar-3 { height: 28rpx; }

/* 分享图标 - 向上箭头 */
.icon-share {
  position: relative;
  width: 36rpx;
  height: 48rpx;
}

.icon-share .arrow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 12rpx solid transparent;
  border-right: 12rpx solid transparent;
  border-bottom: 14rpx solid rgba(255, 255, 255, 0.65);
}

.icon-share .base {
  position: absolute;
  top: 12rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 6rpx;
  height: 24rpx;
  background: rgba(255, 255, 255, 0.65);
  border-radius: 3rpx;
}

/* AI分析图标 - 脉冲线 */
.icon-analysis {
  position: relative;
  width: 44rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-analysis .pulse {
  width: 100%;
  height: 5rpx;
  background: rgba(255, 255, 255, 0.65);
  position: relative;
}

.icon-analysis .pulse::before {
  content: '';
  position: absolute;
  left: 25%;
  top: -12rpx;
  width: 5rpx;
  height: 12rpx;
  background: rgba(255, 255, 255, 0.65);
  transform: rotate(-30deg);
}

.icon-analysis .pulse::after {
  content: '';
  position: absolute;
  left: 50%;
  top: -18rpx;
  width: 5rpx;
  height: 24rpx;
  background: rgba(255, 255, 255, 0.65);
}

/* 2X 标签脉冲动画 */
@keyframes pulse-green {
  0%, 100% {
    box-shadow: 0 0 24rpx rgba(69, 224, 160, 0.5);
    transform: translateY(-50%) scale(1);
  }
  50% {
    box-shadow: 0 0 40rpx rgba(69, 224, 160, 0.8);
    transform: translateY(-50%) scale(1.05);
  }
}

@keyframes pulse-red {
  0%, 100% {
    box-shadow: 0 0 24rpx rgba(255, 107, 107, 0.5);
    transform: translateY(-50%) scale(1);
  }
  50% {
    box-shadow: 0 0 40rpx rgba(255, 107, 107, 0.8);
    transform: translateY(-50%) scale(1.05);
  }
}

/* 时间周期选择器 */
.time-period-bar {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  gap: 8rpx;
  padding: 6rpx 0;
  flex-shrink: 0;
}

.period-btn {
  padding: 10rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.06);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.period-btn text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 500;
}

.period-active {
  background: rgba(75, 227, 164, 0.18);
  border-color: rgba(75, 227, 164, 0.45);
}

.period-active text {
  color: #4BE3A4;
  font-weight: 700;
}

.period-btn:active {
  transform: scale(0.95);
  opacity: 0.8;
}

/* 金币奖励弹窗 */
.coin-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.coin-popup {
  width: 560rpx;
  background: linear-gradient(180deg, #1a2340 0%, #0d1220 100%);
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2rpx solid rgba(255, 216, 111, 0.3);
  box-shadow: 0 20rpx 80rpx rgba(255, 216, 111, 0.2);
}

.coin-popup-icon {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.coin-popup-title {
  font-size: 36rpx;
  color: #fff;
  font-weight: 600;
  margin-bottom: 30rpx;
}

.coin-popup-amount {
  font-size: 80rpx;
  color: #ffd86f;
  font-weight: 800;
  text-shadow: 0 4rpx 20rpx rgba(255, 216, 111, 0.5);
  line-height: 1;
}

.coin-popup-label {
  font-size: 28rpx;
  color: rgba(255, 216, 111, 0.8);
  margin-top: 10rpx;
  margin-bottom: 40rpx;
}

.coin-popup-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #4be3a4 0%, #18c98a 100%);
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 30rpx rgba(16, 201, 138, 0.4);
}

.coin-popup-btn text {
  font-size: 32rpx;
  color: #05130d;
  font-weight: 700;
  letter-spacing: 2rpx;
}

/* 交易结果弹窗 */
.trade-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 500;
  pointer-events: auto;
}

.trade-popup-content {
  background: rgba(20, 28, 50, 0.95);
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  border-radius: 20rpx;
  padding: 28rpx 36rpx;
  min-width: 380rpx;
  box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.5);
}

.trade-popup-title {
  display: block;
  font-size: 32rpx;
  color: #4be3a4;
  font-weight: 700;
  margin-bottom: 16rpx;
  text-align: center;
}

.trade-popup-lines {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.trade-popup-line {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  text-align: center;
}

/* 新手指引弹窗 */
.guide-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 600;
}

.guide-popup {
  background: rgba(20, 28, 50, 0.98);
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  border-radius: 24rpx;
  padding: 40rpx;
  min-width: 440rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.5);
}

.guide-title {
  display: block;
  font-size: 36rpx;
  color: #fff;
  font-weight: 700;
  text-align: center;
  margin-bottom: 32rpx;
}

.guide-items {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.guide-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.guide-arrow {
  width: 56rpx;
  height: 56rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
}

.guide-arrow.right {
  background: rgba(75, 227, 164, 0.2);
  color: #4be3a4;
}

.guide-arrow.left {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}

.guide-arrow.up {
  background: rgba(100, 150, 255, 0.2);
  color: #6496ff;
}

.guide-arrow.down {
  background: rgba(255, 216, 111, 0.2);
  color: #ffd86f;
}

.guide-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.guide-tip {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  margin-top: 28rpx;
}
</style>
