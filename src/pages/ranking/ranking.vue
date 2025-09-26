<template>
  <view class="container">
    <text class="title">排行榜</text>
    <view class="list">
      <view class="item" v-for="(user, index) in rankings" :key="index">
        <text>{{index + 1}}. {{user.name}}</text>
        <text>{{user.score}}金币</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      rankings: [
        {name: '玩家1', score: 9999},
        {name: '玩家2', score: 8888},
        {name: '你', score: 1000}
      ]
    }
  }
}
</script>

<style>
.container {
  padding: 30rpx;
}
.title {
  font-size: 48rpx;
  text-align: center;
  display: block;
  margin-bottom: 40rpx;
}
.item {
  display: flex;
  justify-content: space-between;
  padding: 20rpx;
  border-bottom: 1px solid #eee;
}
</style>
