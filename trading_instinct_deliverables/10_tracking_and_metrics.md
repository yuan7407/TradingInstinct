# 埋点与关键指标（可编辑）

## 必要埋点（事件 + 属性）
1. `app_open`  
   - 属性：source（分享/公众号/直接）
2. `start_round`  
   - 属性：user_id (匿名可选), slice_id, difficulty
3. `make_guess`  
   - 属性：slice_id, guess (up/down), confidence, timestamp
4. `reveal_outcome`  
   - Properties: slice_id, actual_outcome, user_result_percent, score_delta
5. `view_explanation`  
   - 属性：slice_id, explanation_id
6. `share_result`  
   - 属性：slice_id, channel (wx_friend/moments)
7. `complete_session`  
   - 属性：rounds_played, total_session_time
8. `signup` / `bind`（如有）
9. `purchase`（未来变现）

## KPI 公式（示例）
- D1 留存 = 次日仍有至少一次 `app_open` 的用户数 / 当日新增用户数
- D7 留存 = 7日内仍有至少一次 `app_open` 的用户数 / 当日新增用户数
- 平均会话时长 = 总会话时长 / 会话次数
- 分享率 = share_result 事件数 / complete_session 数

## 初期目标（参考）
- D1 ≥ 35%，D7 ≥ 12%，平均会话时长 ≥ 5 分钟，分享率 ≥ 10%
