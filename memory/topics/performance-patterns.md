# 性能优化模式

## 手势优化（最关键）

### 非响应式变量
- **规则**: 手势相关变量用 `_` 前缀，不放入 Vue `data()`
- **原因**: touchmove 每帧触发（16ms），放入 data → setData → 视图更新 → 卡顿
- **变量列表**:
  - `_startX`, `_startY` — 触摸起点
  - `_isDragging` — 是否拖拽中
  - `_axis` — 锁定方向（'h'/'v'/null）
  - `_longPressTimer` — 长按计时器
  - `_is2X` — 是否 2X 模式
  - `_moveX`, `_moveY` — 当前偏移量

### touchmove 最小化
- 只读取 `touches[0]` 坐标，计算距离
- 方向判定只做一次（首次 >10px 时）
- 只在跨越阈值时切换 data 中的 class（如 `showBuy` → true）
- **绝不**在 touchmove 中做 Canvas 重绘或复杂计算

### touchmove 事件修饰符
- `@touchmove.stop.prevent` — 阻止冒泡和默认行为（防止页面滚动）

## Canvas 优化

### 引用缓存
- **变量**: `_cachedCanvas`, `_cachedCtx`, `_cachedDimensions`
- **原因**: `wx.createSelectorQuery().select('#klineCanvas').node()` 需要 250ms+
- **规则**: 首次获取后缓存，后续直接使用，不重复查询

### Canvas 2D API
- 使用 `type="2d"` 而非旧版 Canvas 1.0
- 获取: `query.select('#klineCanvas').node(res => { canvas = res.node; ctx = canvas.getContext('2d') })`
- 尺寸初始化: 设置 `canvas.width/height` 为实际像素（devicePixelRatio）

### 尺寸降级
- selector 可能返回异常尺寸 (<300x150)
- 降级方案: 使用 CSS 计算的预估尺寸
- 检测: `if (width < 300 || height < 150)` 则使用 `windowWidth * 0.9` 等估算

## CSS 动画优化

### 原则：CSS 优先于 JS
- 所有视觉反馈（倾斜/背景/光斑）用 CSS class 切换
- **不用** JS `requestAnimationFrame` 做视觉动画
- 让浏览器的合成器线程处理动画，不阻塞主线程

### transform 冲突问题
- **症状**: `@keyframes` 中的 `transform: translate()` 与类选择器的 `transform: rotate()` 冲突
- **原因**: CSS 动画优先级高于普通规则，会覆盖类选择器的 transform
- **解决**: 方向偏移改用 `margin-left` / `margin-top`（不与 transform 冲突）

### will-change 使用
- 光斑元素: `will-change: transform`（blur 大面积元素需要独立合成层）
- 卡片元素: `will-change: transform`（频繁倾斜动画）
- **注意**: 不要滥用，只对确实会变化的元素添加

### transition 配置
- 卡片倾斜: `transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)`（弹性回弹）
- 背景渐变: `background 0.2s ease`（快速响应滑动方向）
- 光斑位置: `top 0.8s ease, left 0.8s ease`（平滑切换）
- 方向偏移: `margin 0.25s ease-out`（跟随滑动方向）

## 帧率目标
- **标准**: ≤16ms/frame（60fps）
- **验证**: 微信开发者工具 Performance 面板
- **关键路径**: touchmove handler → class切换 → CSS transition（不经过 JS 动画）

## 数据加载
- K线数据: 一次性加载全量（1000根），不分段请求
- 缓存: localStorage 缓存已获取的 K线数据，避免重复请求
- Mock: API 失败时立即切换到本地生成的模拟数据，不等待重试
