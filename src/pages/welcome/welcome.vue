<template>
    <view class="welcome-container">
      <!-- 背景动画 -->
      <canvas 
        canvas-id="bgCanvas" 
        class="bg-canvas"
        :style="{width: canvasWidth + 'px', height: canvasHeight + 'px'}"
      ></canvas>
      
      <!-- 主内容 -->
      <view class="content">
        <!-- Logo和标题 -->
        <view class="logo-section" :class="{show: showContent}">
          <text class="logo">📈</text>
          <text class="title">盘感</text>
          <text class="subtitle">Trading Instinct</text>
        </view>
        
        <!-- Slogan -->
        <view class="slogan-section" :class="{show: showSlogan}">
          <text class="slogan">左滑右滑，练就盘感</text>
          <text class="desc">在真实历史行情中磨练你的交易直觉</text>
        </view>
        
        <!-- 登录按钮 -->
        <view class="login-section" :class="{show: showButtons}">
          <button class="login-btn wechat" @click="wechatLogin">
            <text>微信登录</text>
          </button>
          <button class="login-btn guest" @click="guestLogin">
            <text>游客体验</text>
          </button>
        </view>
        
        <!-- 底部信息 -->
        <view class="footer">
          <text class="version">v1.0.0</text>
        </view>
      </view>
    </view>
  </template>
  
  <script>
  export default {
    data() {
      return {
        canvasWidth: 375,
        canvasHeight: 667,
        showContent: false,
        showSlogan: false,
        showButtons: false,
        particles: [],
        animationId: null
      }
    },
    
    onLoad() {
      // 获取屏幕尺寸
      const sys = uni.getSystemInfoSync()
      this.canvasWidth = sys.windowWidth
      this.canvasHeight = sys.windowHeight
    },
    
    onReady() {
      this.initAnimation()
      this.showElements()
    },
    
    onUnload() {
      // 清理动画
      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
      }
    },
    
    methods: {
      initAnimation() {
        // 创建粒子动画
        const ctx = uni.createCanvasContext('bgCanvas', this)
        
        // 初始化粒子
        for(let i = 0; i < 50; i++) {
          this.particles.push({
            x: Math.random() * this.canvasWidth,
            y: Math.random() * this.canvasHeight,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 3 + 1,
            opacity: Math.random() * 0.5 + 0.2
          })
        }
        
        // 动画循环
        const animate = () => {
          ctx.setFillStyle('#0a0e27')
          ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
          
          // 绘制连线
          this.particles.forEach((p1, i) => {
            this.particles.slice(i + 1).forEach(p2 => {
              const dist = Math.sqrt(
                Math.pow(p1.x - p2.x, 2) + 
                Math.pow(p1.y - p2.y, 2)
              )
              if (dist < 100) {
                ctx.setStrokeStyle(`rgba(0, 216, 138, ${0.2 * (1 - dist/100)})`)
                ctx.setLineWidth(0.5)
                ctx.beginPath()
                ctx.moveTo(p1.x, p1.y)
                ctx.lineTo(p2.x, p2.y)
                ctx.stroke()
              }
            })
          })
          
          // 绘制粒子
          this.particles.forEach(p => {
            // 更新位置
            p.x += p.vx
            p.y += p.vy
            
            // 边界反弹
            if (p.x < 0 || p.x > this.canvasWidth) p.vx = -p.vx
            if (p.y < 0 || p.y > this.canvasHeight) p.vy = -p.vy
            
            // 绘制
            ctx.setFillStyle(`rgba(0, 216, 138, ${p.opacity})`)
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI)
            ctx.fill()
          })
          
          ctx.draw()
          
          // 继续动画
          setTimeout(() => {
            animate()
          }, 30)
        }
        
        animate()
      },
      
      showElements() {
        // 依次显示元素
        setTimeout(() => {
          this.showContent = true
        }, 300)
        
        setTimeout(() => {
          this.showSlogan = true
        }, 800)
        
        setTimeout(() => {
          this.showButtons = true
        }, 1300)
      },
      
      wechatLogin() {
        uni.showLoading({ title: '登录中...' })
        
        // 微信登录逻辑
        uni.login({
          provider: 'weixin',
          success: (loginRes) => {
            // 获取用户信息
            uni.getUserProfile({
              desc: '用于完善用户资料',
              success: (infoRes) => {
                // 保存用户信息
                uni.setStorageSync('userInfo', infoRes.userInfo)
                uni.setStorageSync('isGuest', false)
                
                uni.hideLoading()
                this.enterGame()
              },
              fail: () => {
                uni.hideLoading()
                uni.showToast({
                  title: '授权失败',
                  icon: 'none'
                })
              }
            })
          },
          fail: () => {
            uni.hideLoading()
            // 如果微信登录失败，提示游客登录
            uni.showModal({
              title: '提示',
              content: '微信登录失败，是否以游客身份体验？',
              success: (res) => {
                if (res.confirm) {
                  this.guestLogin()
                }
              }
            })
          }
        })
      },
      
      guestLogin() {
        // 游客登录
        uni.setStorageSync('userInfo', {
          nickName: '游客',
          avatarUrl: '/static/default-avatar.png'
        })
        uni.setStorageSync('isGuest', true)
        
        uni.showToast({
          title: '欢迎体验',
          icon: 'none',
          duration: 1000
        })
        
        setTimeout(() => {
          this.enterGame()
        }, 1000)
      },
      
      enterGame() {
        // 进入游戏主页
        uni.redirectTo({
          url: '/pages/index/index'
        })
      }
    }
  }
  </script>
  
  <style>
  .welcome-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }
  
  .bg-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  .content {
    position: relative;
    z-index: 10;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60rpx;
  }
  
  .logo-section {
    text-align: center;
    margin-bottom: 80rpx;
    opacity: 0;
    transform: translateY(-30rpx);
    transition: all 0.8s ease;
  }
  
  .logo-section.show {
    opacity: 1;
    transform: translateY(0);
  }
  
  .logo {
    font-size: 120rpx;
    display: block;
    margin-bottom: 20rpx;
  }
  
  .title {
    font-size: 72rpx;
    color: #fff;
    font-weight: bold;
    display: block;
    margin-bottom: 10rpx;
  }
  
  .subtitle {
    font-size: 32rpx;
    color: #8b92b9;
    display: block;
  }
  
  .slogan-section {
    text-align: center;
    margin-bottom: 100rpx;
    opacity: 0;
    transform: translateY(-20rpx);
    transition: all 0.8s ease;
  }
  
  .slogan-section.show {
    opacity: 1;
    transform: translateY(0);
  }
  
  .slogan {
    font-size: 36rpx;
    color: #00d88a;
    display: block;
    margin-bottom: 20rpx;
  }
  
  .desc {
    font-size: 28rpx;
    color: #8b92b9;
    display: block;
  }
  
  .login-section {
    width: 100%;
    opacity: 0;
    transform: translateY(20rpx);
    transition: all 0.8s ease;
  }
  
  .login-section.show {
    opacity: 1;
    transform: translateY(0);
  }
  
  .login-btn {
    width: 100%;
    height: 100rpx;
    margin-bottom: 30rpx;
    border-radius: 50rpx;
    font-size: 32rpx;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .login-btn.wechat {
    background: linear-gradient(90deg, #00d88a, #00b870);
    color: #fff;
  }
  
  .login-btn.guest {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 2rpx solid #00d88a;
  }
  
  .footer {
    position: absolute;
    bottom: 60rpx;
    left: 0;
    right: 0;
    text-align: center;
  }
  
  .version {
    color: #666;
    font-size: 24rpx;
  }
  </style>