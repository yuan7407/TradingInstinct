<template>
  <view class="welcome-container">
    <image
      class="bg-fallback"
      src="/static/media/brand-campaign-poster.png"
      mode="aspectFill"
    ></image>
    <view class="bg-overlay"></view>
    <view class="bg-glow"></view>

    <view class="content">
      <view class="brand-block" :class="{show: showContent}">
        <image
          class="brand-logo"
          src="/static/branding/trading-instinct-logo.svg"
          mode="widthFix"
        ></image>
        <text class="brand-title">盘感</text>
        <text class="brand-subtitle">Trading Instinct</text>
      </view>

      <view class="slogan-section" :class="{show: showSlogan}">
        <text class="slogan">{{ currentSlogan }}</text>
        <text class="desc">用真实历史行情磨练你的交易直觉</text>
      </view>

      <view class="login-section" :class="{show: showButtons}">
        <button class="login-btn wechat" @click="wechatLogin">
          <text>微信登录</text>
        </button>
        <button class="login-btn guest" @click="guestLogin">
          <text>游客体验</text>
        </button>
      </view>

      <view class="footer">
        <text class="version">v1.0.0</text>
        <text class="footer-tag">Swipe · Decide · Repeat</text>
      </view>
    </view>
  </view>
</template>

<script>
// 随机slogan列表
const SLOGANS = [
  '模拟盘都亏，你凭什么打得赢量化？',
  '韭菜？滑两下试试',
  '划重点不看，开卷考都不及格？',
  '滑完才信AI教得好？'
]

export default {
  data() {
    return {
      showContent: false,
      showSlogan: false,
      showButtons: false,
      currentSlogan: SLOGANS[Math.floor(Math.random() * SLOGANS.length)]
    }
  },

  onReady() {
    this.showElements()
  },

  methods: {
    showElements() {
      setTimeout(() => { this.showContent = true }, 300)
      setTimeout(() => { this.showSlogan = true }, 800)
      setTimeout(() => { this.showButtons = true }, 1300)
    },

    wechatLogin() {
      uni.setStorageSync('userInfo', {
        nickName: '微信用户',
        avatarUrl: '/static/default-avatar.png'
      })
      uni.setStorageSync('isGuest', false)

      uni.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1000
      })

      setTimeout(() => this.enterGame(), 1000)
    },

    guestLogin() {
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

      setTimeout(() => this.enterGame(), 1000)
    },

    enterGame() {
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
  background: #0b0f1c;
  display: flex;
  flex-direction: column;
}

page {
  width: 100%;
  height: 100%;
  background: #0b0f1c;
}

.bg-video {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  transform: scale(1.02);
}

.bg-fallback {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  transform: scale(1.02);
}

.bg-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background:
    linear-gradient(180deg, rgba(7, 10, 20, 0.15) 0%, rgba(7, 10, 20, 0.85) 68%, rgba(7, 10, 20, 0.98) 100%),
    radial-gradient(circle at 20% 20%, rgba(32, 194, 156, 0.12), transparent 55%);
  z-index: 1;
}

.bg-glow {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: radial-gradient(circle at 75% 15%, rgba(255, 255, 255, 0.15), transparent 50%);
  z-index: 1;
  mix-blend-mode: screen;
  opacity: 0.35;
}

.content {
  position: relative;
  z-index: 2;
  flex: 1;
  height: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 140rpx 56rpx 90rpx;
  box-sizing: border-box;
}

.brand-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 18rpx;
  opacity: 0;
  transform: translateY(-30rpx);
  transition: all 0.8s ease;
}

.brand-block.show {
  opacity: 1;
  transform: translateY(0);
}

.brand-logo {
  width: 320rpx;
  display: block;
}

.brand-title {
  font-size: 64rpx;
  color: #f7f9ff;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.brand-subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 4rpx;
}

.slogan-section {
  opacity: 0;
  transform: translateY(-20rpx);
  transition: all 0.8s ease;
}

.slogan-section.show {
  opacity: 1;
  transform: translateY(0);
}

.slogan {
  font-size: 38rpx;
  color: #6ee7c9;
  display: block;
  margin-bottom: 18rpx;
  font-weight: 600;
  letter-spacing: 1rpx;
}

.desc {
  font-size: 26rpx;
  color: rgba(206, 216, 242, 0.75);
  display: block;
}

.login-section {
  width: 100%;
  opacity: 0;
  transform: translateY(20rpx);
  transition: all 0.8s ease;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.login-section.show {
  opacity: 1;
  transform: translateY(0);
}

.login-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 48rpx;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 3rpx;
}

.login-btn.wechat {
  background: linear-gradient(135deg, #4be3a4 0%, #18c98a 100%);
  color: #05130d;
  box-shadow: 0 18rpx 40rpx rgba(16, 201, 138, 0.35);
}

.login-btn.guest {
  background: rgba(12, 16, 31, 0.55);
  color: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.45);
}

.version {
  font-size: 24rpx;
  letter-spacing: 2rpx;
}

.footer-tag {
  font-size: 22rpx;
  letter-spacing: 2rpx;
}
</style>
