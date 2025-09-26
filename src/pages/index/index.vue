<template>
	<view class="container">
	  <!-- 顶部信息 -->
	  <view class="header">
		<text class="title">盘感</text>
		<text class="round">第 {{Math.min(currentDecision, 10)}}/10 决策</text>
	  </view>
	  
	  <!-- K线图区域 -->
	  <view class="chart-wrapper">
		<view 
		  class="chart-area"
		  @touchstart="onTouchStart"
		  @touchmove.stop.prevent="onTouchMove" 
		  @touchend="onTouchEnd"
		>
		  <canvas 
			canvas-id="kline" 
			class="kline-canvas"
			disable-scroll="true"
		  ></canvas>
		  
		  <!-- 当前位置指示器 -->
		  <view class="current-indicator" :style="{left: currentPosition + 'rpx'}">
			<view class="indicator-line"></view>
		  </view>
		</view>
	  </view>
	  
	  <!-- 当前状态 -->
	  <view class="status">
		<view class="profit-display">
		  <text class="label">当前仓位</text>
		  <text class="position-text">{{positionText}}</text>
		</view>
		<view class="coins-display">
		  <text class="label">账户资金</text>
		  <text class="coins">💰 {{totalAsset.toFixed(0)}}</text>
		</view>
	  </view>
	  
	  <!-- 操作提示 -->
	  <view class="hint">
		<text class="bear">← 做空</text>
		<view class="swipe-icon">👆 滑动决策</view>
		<text class="bull">做多 →</text>
	  </view>
	  
	</view>
  </template>
  
  <script>
  export default {
	data() {
	  return {
		// 游戏状态
		gameEnded: false,
		currentDecision: 1,
		
		// K线数据
		allKlineData: [],
		visibleKlines: 30,
		currentIndex: 20,
		currentPosition: 400,
		
		// 交易记录
		decisions: [],
		totalAsset: 10000,
		position: 0, // -1: 做空, 0: 空仓, 1: 做多
		entryPrice: 0,
		currentProfit: 0,
		
		// 触摸控制
		startX: 0,
		startY: 0,
		isProcessing: false
	  }
	},
	
	computed: {
	  positionText() {
		if (this.position === 1) {
		  return `做多 @ ${this.entryPrice.toFixed(2)}`
		} else if (this.position === -1) {
		  return `做空 @ ${this.entryPrice.toFixed(2)}`
		} else {
		  return '空仓'
		}
	  }
	},
	
	onReady() {
	  this.initGame()
	},
	
	methods: {
	  initGame() {
		this.generateFullKlineData()
		this.drawChart()
	  },
	  
	  generateFullKlineData() {
		const klines = []
		let basePrice = 100
		const trend = Math.random() > 0.5 ? 0.3 : -0.3
		
		for(let i = 0; i < 100; i++) {
		  const trendEffect = trend * (Math.random() * 1.5)
		  const volatility = (Math.random() - 0.5) * 5
		  basePrice = basePrice * (1 + (trendEffect + volatility) / 100)
		  
		  const open = i === 0 ? basePrice : klines[i-1]?.close || basePrice
		  const change = (Math.random() - 0.5 + trend/10) * 4
		  const close = open * (1 + change/100)
		  const high = Math.max(open, close) * (1 + Math.random() * 0.015)
		  const low = Math.min(open, close) * (1 - Math.random() * 0.015)
		  
		  klines.push({
			index: i,
			open: open,
			close: close,
			high: high,
			low: low,
			date: `Day ${i+1}`
		  })
		}
		
		this.allKlineData = klines
	  },
	  
	  drawChart() {
		const ctx = uni.createCanvasContext('kline', this)
		const width = 350
		const height = 250
		
		// 背景
		ctx.setFillStyle('#1a1a2e')
		ctx.fillRect(0, 0, width, height)
		
		// 获取当前可见的K线
		const startIdx = Math.max(0, this.currentIndex - this.visibleKlines)
		const endIdx = this.currentIndex
		const visibleData = this.allKlineData.slice(startIdx, endIdx)
		
		if (visibleData.length === 0) return
		
		// 计算价格范围
		const prices = visibleData.flatMap(k => [k.high, k.low])
		const minPrice = Math.min(...prices) * 0.95
		const maxPrice = Math.max(...prices) * 1.05
		const priceRange = maxPrice - minPrice || 1
		
		// 定义价格转换函数（放在这里确保在整个方法内都可用）
		const y = (p) => height - ((p - minPrice) / priceRange * height)
		
		// 画网格
		ctx.setStrokeStyle('#2a2a3e')
		ctx.setLineWidth(0.5)
		for(let i = 1; i < 5; i++) {
		  ctx.beginPath()
		  ctx.moveTo(0, i * 50)
		  ctx.lineTo(width, i * 50)
		  ctx.stroke()
		}
		
		// 绘制K线
		const barWidth = width / this.visibleKlines
		visibleData.forEach((k, index) => {
		  const x = index * barWidth + barWidth/2
		  
		  const isUp = k.close >= k.open
		  const color = isUp ? '#00d88a' : '#ff5b5b'
		  
		  // 画影线
		  ctx.setStrokeStyle(color)
		  ctx.setLineWidth(1)
		  ctx.beginPath()
		  ctx.moveTo(x, y(k.high))
		  ctx.lineTo(x, y(k.low))
		  ctx.stroke()
		  
		  // 画实体
		  const bodyTop = y(Math.max(k.open, k.close))
		  const bodyBottom = y(Math.min(k.open, k.close))
		  const bodyHeight = Math.max(bodyBottom - bodyTop, 1)
		  
		  if (isUp) {
			// 阳线 - 空心
			ctx.setFillStyle('#1a1a2e')
			ctx.fillRect(x - barWidth/3, bodyTop, barWidth*2/3, bodyHeight)
			ctx.setStrokeStyle('#00d88a')
			ctx.setLineWidth(1.5)
			ctx.strokeRect(x - barWidth/3, bodyTop, barWidth*2/3, bodyHeight)
		  } else {
			// 阴线 - 实心
			ctx.setFillStyle('#ff5b5b')
			ctx.fillRect(x - barWidth/3, bodyTop, barWidth*2/3, bodyHeight)
		  }
		})
		
		// 绘制交易标记
		this.decisions.forEach(d => {
		  if (d.index >= startIdx && d.index < endIdx) {
			const markerX = (d.index - startIdx) * barWidth + barWidth/2
			const kline = this.allKlineData[d.index]
			if (!kline) return
			
			const markerY = y(kline.high) - 15  // 在最高价上方15像素
			
			// 画圆圈
			ctx.setFillStyle(d.type === 'long' ? '#00d88a' : '#ff5b5b')
			ctx.beginPath()
			ctx.arc(markerX, markerY, 6, 0, 2 * Math.PI)
			ctx.fill()
			
			// 画文字
			ctx.setFillStyle('#fff')
			ctx.setFontSize(10)
			const text = d.type === 'long' ? '多' : '空'
			ctx.fillText(text, markerX - 4, markerY + 3)
		  }
		})
		
		ctx.draw()
	  },
	  
	  onTouchStart(e) {
		if (this.gameEnded || this.isProcessing) return
		this.startX = e.touches[0].pageX
		this.startY = e.touches[0].pageY
	  },
	  
	  onTouchMove(e) {
		e.preventDefault()
		e.stopPropagation()
		return false
	  },
	  
	  onTouchEnd(e) {
		if (this.gameEnded || this.isProcessing || this.currentDecision > 10) return
		
		const endX = e.changedTouches[0].pageX
		const diffX = endX - this.startX
		
		if (Math.abs(diffX) > 30) {
		  const decision = diffX > 0 ? 'long' : 'short'
		  this.makeDecision(decision)
		}
	  },
	  
	  makeDecision(decision) {
		if (this.currentDecision > 10 || this.gameEnded || this.isProcessing) return
		
		this.isProcessing = true
		const currentPrice = this.allKlineData[this.currentIndex - 1].close
		
		// 支持做多做空
		if (this.position === 0) {
		  // 开仓
		  this.position = decision === 'long' ? 1 : -1
		  this.entryPrice = currentPrice
		  
		  this.decisions.push({
			type: decision,
			price: currentPrice,
			index: this.currentIndex - 1,
			action: 'open'
		  })
		  
		  uni.showToast({
			title: `${decision === 'long' ? '做多' : '做空'} @ ${currentPrice.toFixed(2)}`,
			icon: 'none',
			duration: 800
		  })
		} else {
		  // 平仓并反向开仓
		  let profit = 0
		  if (this.position === 1) {
			// 平多仓
			profit = ((currentPrice - this.entryPrice) / this.entryPrice * 100)
		  } else {
			// 平空仓
			profit = ((this.entryPrice - currentPrice) / this.entryPrice * 100)
		  }
		  
		  this.totalAsset = this.totalAsset * (1 + profit/100)
		  
		  // 反向开仓
		  this.position = decision === 'long' ? 1 : -1
		  this.entryPrice = currentPrice
		  
		  this.decisions.push({
			type: decision,
			price: currentPrice,
			index: this.currentIndex - 1,
			action: 'reverse',
			profit: profit
		  })
		  
		  uni.showToast({
			title: `平仓${profit > 0 ? '✓' : '✗'} → ${decision === 'long' ? '做多' : '做空'}`,
			icon: 'none',
			duration: 800
		  })
		}
		
		// 推进K线图（修复：确保图表前进）
		setTimeout(() => {
		  if (this.currentIndex < this.allKlineData.length - 10) {
			this.currentIndex += 5
			this.drawChart()  // 重绘图表
		  }
		  
		  // 更新决策计数
		  if (this.currentDecision === 10) {
			setTimeout(() => {
			  this.endGame()
			}, 1000)
		  } else {
			this.currentDecision++
			this.isProcessing = false
		  }
		}, 300)
	  },
	  
	  endGame() {
		// 强制平仓计算最终收益
		if (this.position !== 0) {
		  const currentPrice = this.allKlineData[this.currentIndex - 1].close
		  let profit = 0
		  if (this.position === 1) {
			profit = ((currentPrice - this.entryPrice) / this.entryPrice * 100)
		  } else {
			profit = ((this.entryPrice - currentPrice) / this.entryPrice * 100)
		  }
		  this.totalAsset = this.totalAsset * (1 + profit/100)
		}
		
		// 跳转到结算页面
		uni.navigateTo({
		  url: `/pages/result/result?data=${encodeURIComponent(JSON.stringify({
			decisions: this.decisions,
			totalAsset: this.totalAsset,
			initialAsset: 10000,
			stockSymbol: 'NVDA',
			stockName: '英伟达',
			period: '2023.01 - 2024.01',
			klineData: this.allKlineData.slice(0, this.currentIndex)
		  }))}`
		})
	  },
	  
	  goRanking() {
		uni.navigateTo({
		  url: '/pages/ranking/ranking'
		})
	  },
	  
	  showHistory() {
		uni.showToast({
		  title: '历史记录开发中',
		  icon: 'none'
		})
	  }
	}
  }
  </script>
  
  <style>
  .container {
	height: 100vh;
	background: linear-gradient(180deg, #0a0e27 0%, #151933 100%);
	display: flex;
	flex-direction: column;
	overflow: hidden;
  }
  
  .header {
	display: flex;
	justify-content: space-between;
	padding: 30rpx;
  }
  
  .title {
	color: #fff;
	font-size: 40rpx;
	font-weight: bold;
  }
  
  .round {
	color: #8b92b9;
	font-size: 28rpx;
  }
  
  .chart-wrapper {
	display: flex;
	justify-content: center;
	margin: 0 25rpx;
  }
  
  .chart-area {
	position: relative;
	width: 700rpx;
	height: 500rpx;
	background: #1a1a2e;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.3);
  }
  
  .kline-canvas {
	width: 700rpx;
	height: 500rpx;
  }
  
  .current-indicator {
	position: absolute;
	top: 0;
	bottom: 0;
	width: 2rpx;
	pointer-events: none;
  }
  
  .indicator-line {
	width: 2rpx;
	height: 100%;
	background: rgba(255, 255, 255, 0.3);
	border-left: 2rpx dashed #fff;
  }
  
  .status {
	display: flex;
	justify-content: space-around;
	padding: 30rpx;
  }
  
  .profit-display, .coins-display {
	text-align: center;
  }
  
  .label {
	color: #8b92b9;
	font-size: 24rpx;
	display: block;
	margin-bottom: 10rpx;
  }
  
  .position-text {
	color: #fff;
	font-size: 28rpx;
  }
  
  .coins {
	font-size: 36rpx;
	color: #ffd700;
  }
  
  .hint {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 60rpx;
	margin: 20rpx 0;
  }
  
  .bear {
	color: #ff5b5b;
	font-size: 32rpx;
	font-weight: bold;
  }
  
  .bull {
	color: #00d88a;
	font-size: 32rpx;
	font-weight: bold;
  }
  
  .swipe-icon {
	color: #666;
	font-size: 24rpx;
  }
  
  </style>