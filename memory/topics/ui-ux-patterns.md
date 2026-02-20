# UI/UX 设计模式

## 色彩体系

### 基础背景
- 主背景: `#0b0f1c` → `#070a14`（深蓝暗色调，金融专业感）
- 图表背景: `#1a1a2e`
- 设计意图: 赌博感 → 金融软件审美（深蓝+金色系）

### 交易方向色
- 买入(做多): 绿色 `#00d88a` / 背景 `rgba(27,80,50)` / radial-gradient 右侧扩散
- 卖出(做空): 红色 `#ff5b5b` / 背景 `rgba(80,27,27)` / radial-gradient 左侧扩散
- 换股: 蓝紫色 `rgba(40,40,80)` / 上方扩散
- 跳过: 同换股蓝紫

### 市场主题色
- 美股(US): 蓝色系（默认金融色）
- A股(CN_A): 红色系（中国市场特色）
- 港股(HK): 橙色系
- 加密(CRYPTO): 紫色系

### K线颜色
- 上涨: `#00d88a`（与买入同色系）
- 下跌: `#ff5b5b`（与卖出同色系）

## 光斑系统（背景装饰）

### 结构
- 主游戏页: 2个光斑（spot-a 青色, spot-b 深蓝）
- 股票选择器: 2个光斑，按市场动态变色

### 位置随机化
- 时机: 页面加载(`onReady`) / 每次交易(`advanceChart`) / 选择器打开 / 切换卡片
- 方法: `_randomizeSpots()` / `_randomizePickerSpots()`
- 范围: top/left 10%-80% 随机

### 浮动动画
- 实现: CSS `@keyframes spot-float-a/b`（8s/10s 周期）
- 选择器: `@keyframes picker-float-a/b`（9s/11s 周期）
- 延迟: 不同随机 animation-delay 避免同步

### 方向偏移
- 实现: `margin-left` / `margin-top`（不用 transform，避免与 @keyframes 冲突）
- 过渡: `0.25s ease-out`
- 偏移量: 约 120rpx（跟随滑动方向）

## 卡片倾斜系统

### 基础倾斜
- 1X 模式: `rotate(±8deg)`，买入右倾/卖出左倾
- 2X 模式: `rotate(±14deg)`，更大角度表示加仓
- 回弹: `cubic-bezier(0.34, 1.56, 0.64, 1)` 弹性效果

### 卡片 CSS class
- `card-tilt-right` / `card-tilt-left`: 1X 倾斜
- `card-tilt-right-2x` / `card-tilt-left-2x`: 2X 倾斜
- `card-tilt-up` / `card-tilt-down`: 上滑换股/下滑跳过

## 股票选择器（卡片轮盘）

### 3D 旋转木马
- 中心卡片: `scale(1.0)`，完全不透明
- 侧面卡片: `scale(0.88)`，`rotate(±6deg)`，半透明
- 切换动画: swiper 组件原生过渡

### 市场 Tab
- 4个市场 Tab: 全部/美股/A股/港股/加密
- 切换时: 光斑颜色跟随市场主题变化

## 术语简化策略
- 做多/做空 → 买入/卖出（降低理解门槛）
- 开仓/平仓 → 买入/卖出
- 止损/止盈 → 不显示（通过游戏机制自然体现）

## 字体与文字
- 标签文字: 56-64rpx
- 发光效果: `text-shadow` 多层叠加
- 2X 标签: 更大字号 + 更强发光

## 动画原则
- CSS 优先: 所有视觉反馈用 CSS class 切换，不用 JS requestAnimationFrame
- transform + will-change: 启用 GPU 加速
- cubic-bezier 弹性: `(0.34, 1.56, 0.64, 1)` 用于回弹效果
- transition 时长: 倾斜回弹 0.35s，背景渐变 0.2s，位置切换 0.8s
