<template>
	<view class="game-container">
	  <!-- 顶部信息栏 -->
	  <view class="header">
		<text class="title">盘感 Trading Instinct</text>
		<text class="round-info">第 {{currentRound}}/{{totalRounds}} 轮</text>
	  </view>
  
	  <!-- K线图卡片区域 -->
	  <view class="chart-container">
		<swiper 
		  class="swiper-box"
		  @change="onSwipeChange"
		  :current="currentIndex"
		  duration="300"
		>
		  <swiper-item v-for="(stock, index) in stockList" :key="index">
			<view class="chart-card">
			  <!-- K线图组件 -->
			  <view class="kline-wrapper">
				<ec-canvas 
				  :canvas-id="'kline-' + index"
				  :ec="getChartOption(stock)"
				  v-if="index === currentIndex"
				/>
				<!-- 隐藏区域遮罩 -->
				<view class="hidden-mask">
				  <text class="mask-text">？？？</text>
				</view>
			  </view>
			  
			  <!-- 当前收益显示 -->
			  <view class="profit-info">
				<text class="profit-label">当前收益率</text>
				<text :class="['profit-value', currentProfit >= 0 ? 'profit-up' : 'profit-down']">
				  {{currentProfit >= 0 ? '+' : ''}}{{currentProfit}}%
				</text>
			  </view>
			</view>
		  </swiper-item>
		</swiper>
	  </view>
  
	  <!-- 滑动提示区域 -->
	  <view class="action-area">
		<view class="action-hint">
		  <text class="bearish">← 看跌</text>
		  <text class="bullish">看涨 →</text>
		</view>
		<view class="coin-info">
		  <image src="/static/coin.png" class="coin-icon"/>
		  <text class="coin-count">{{userCoins}}</text>
		</view>
	  </view>
  
	  <!-- 底部导航 -->
	  <view class="bottom-nav">
		<view class="nav-item" @click="goToRanking">
		  <image src="/static/ranking.png"/>
		  <text>排行榜</text>
		</view>
		<view class="nav-item" @click="goToHistory">
		  <image src="/static/history.png"/>
		  <text>历史战绩</text>
		</view>
		<view class="nav-item active">
		  <image src="/static/play.png"/>
		  <text>每日挑战</text>
		</view>
	  </view>
	</view>
  </template>
  
  <script>
  export default {
	data() {
	  return {
		currentRound: 1,
		totalRounds: 10,
		currentIndex: 0,
		stockList: [],
		currentProfit: 0,
		userCoins: 1000,
		userDecisions: [], // 记录用户的决策
		
		// K线图配置
		chartOption: {}
	  }
	},
	
	onLoad() {
	  this.initGame()
	},
	
	methods: {
	  // 初始化游戏
	  initGame() {
		// 加载预设的股票数据
		this.loadStockData()
		this.setupChart()
	  },
	  
	  // 加载股票数据
	  loadStockData() {
		// MVP版本：使用预设的静态数据
		this.stockList = [
		  {
			symbol: 'HIDDEN',  // 初始隐藏股票代码
			data: this.generateMockKLineData(),
			realSymbol: 'NVDA',
			period: '2023.01-2024.01',
			finalReturn: 326
		  }
		]
	  },
	  
	  // 生成模拟K线数据
	  generateMockKLineData() {
		// 这里先用模拟数据，后续接入真实API
		const data = []
		let basePrice = 100
		
		for(let i = 0; i < 60; i++) {  // 60个交易日
		  const change = (Math.random() - 0.45) * 5  // 略微偏涨
		  basePrice = basePrice * (1 + change/100)
		  
		  data.push({
			date: `Day ${i+1}`,
			open: basePrice * (1 + (Math.random()-0.5)*0.02),
			close: basePrice,
			high: basePrice * (1 + Math.random()*0.03),
			low: basePrice * (1 - Math.random()*0.03),
			volume: Math.floor(Math.random() * 1000000)
		  })
		}
		return data
	  },
	  
	  // 处理滑动
	  onSwipeChange(e) {
		const direction = e.detail.dx > 0 ? 'bull' : 'bear'
		this.makeDecision(direction)
	  },
	  
	  // 记录决策
	  makeDecision(direction) {
		this.userDecisions.push({
		  round: this.currentRound,
		  decision: direction,
		  timestamp: Date.now()
		})
		
		// 更新轮次
		this.currentRound++
		
		// 判断是否结束
		if(this.currentRound > this.totalRounds) {
		  this.showResult()
		} else {
		  this.revealNextCandle()
		}
	  },
	  
	  // 揭示下一根K线
	  revealNextCandle() {
		// 逐步展示K线图的逻辑
		this.updateChart()
	  },
	  
	  // 显示结果
	  showResult() {
		uni.navigateTo({
		  url: `/pages/result/result?decisions=${JSON.stringify(this.userDecisions)}&stock=${this.stockList[0].realSymbol}`
		})
	  },
	  
	  // 获取图表配置
	  getChartOption(stock) {
		return {
		  ec: {
			option: {
			  xAxis: {
				type: 'category',
				data: stock.data.map(d => d.date)
			  },
			  yAxis: {
				type: 'value'
			  },
			  series: [{
				type: 'candlestick',
				data: stock.data.map(d => [d.open, d.close, d.low, d.high])
			  }]
			}
		  }
		}
	  }
	}
  }
  </script>
  
  <style>
  .game-container {
	height: 100vh;
	background: #0a0e27;
	display: flex;
	flex-direction: column;
  }
  
  .header {
	padding: 20rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
  }
  
  .title {
	color: #fff;
	font-size: 32rpx;
	font-weight: bold;
  }
  
  .round-info {
	color: #8b92b9;
	font-size: 28rpx;
  }
  
  .chart-container {
	flex: 1;
	padding: 20rpx;
  }
  
  .chart-card {
	background: #151933;
	border-radius: 20rpx;
	padding: 30rpx;
	height: 100%;
	position: relative;
  }
  
  .kline-wrapper {
	height: 600rpx;
	position: relative;
  }
  
  .hidden-mask {
	position: absolute;
	right: 0;
	top: 0;
	bottom: 0;
	width: 40%;
	background: linear-gradient(to right, transparent, #151933 20%);
	display: flex;
	align-items: center;
	justify-content: center;
  }
  
  .mask-text {
	color: #8b92b9;
	font-size: 48rpx;
	font-weight: bold;
  }
  
  .profit-info {
	margin-top: 40rpx;
	text-align: center;
  }
  
  .profit-label {
	color: #8b92b9;
	font-size: 28rpx;
	display: block;
  }
  
  .profit-value {
	font-size: 56rpx;
	font-weight: bold;
	margin-top: 10rpx;
  }
  
  .profit-up {
	color: #00d88a;
  }
  
  .profit-down {
	color: #ff5b5b;
  }
  
  .action-area {
	padding: 40rpx;
  }
  
  .action-hint {
	display: flex;
	justify-content: space-between;
	margin-bottom: 30rpx;
  }
  
  .bearish {
	color: #ff5b5b;
	font-size: 32rpx;
  }
  
  .bullish {
	color: #00d88a;
	font-size: 32rpx;
  }
  
  .coin-info {
	display: flex;
	align-items: center;
	justify-content: center;
  }
  
  .coin-icon {
	width: 40rpx;
	height: 40rpx;
	margin-right: 10rpx;
  }
  
  .coin-count {
	color: #ffd700;
	font-size: 36rpx;
	font-weight: bold;
  }
  
  .bottom-nav {
	display: flex;
	justify-content: space-around;
	padding: 20rpx 0;
	border-top: 1px solid #2a3154;
  }
  
  .nav-item {
	display: flex;
	flex-direction: column;
	align-items: center;
  }
  
  .nav-item image {
	width: 48rpx;
	height: 48rpx;
  }
  
  .nav-item text {
	color: #8b92b9;
	font-size: 24rpx;
	margin-top: 10rpx;
  }
  
  .nav-item.active text {
	color: #00d88a;
  }
  </style>