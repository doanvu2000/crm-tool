# features/analysis (domain)

Trái tim nghiệp vụ. Engine thuần TS + Pinia store. Public API: `features/analysis/index.ts`.

## File

| File | Trách nhiệm |
|---|---|
| `model/types.ts` | Hằng thứ tự (`ABC_CLASSES`, `VELOCITY_LEVELS`, `DOS_LEVELS`, `OOS_LEVELS`, `TREND_LEVELS`, `ACTION_GROUPS`, `LIFECYCLES`) + type `SkuInput`, `AnalysisSettings`, `BaseMetrics`, `AbcAssignment`, `Classification`, `ActionDecision`, `SkuContext`, `SkuResult` |
| `model/thresholds.ts` | `THRESHOLDS` (mọi ngưỡng Pilot), `DEFAULT_SETTINGS`, `sanitizeSettings` |
| `engine/metrics.ts` | `computeBaseMetrics`, `categoryAverageAds` |
| `engine/abc.ts` | `metricValue`, `assignAbc` |
| `engine/classify.ts` | `velocityByAds`, `velocityByIndex`, `dosStatus`, `oosStatus`, `trendStatus`, `isCoreSku` |
| `engine/actions.ts` | `decideAction` (rule engine) |
| `engine/analyze.ts` | `analyzeSkus` pipeline |
| `engine/aggregate.ts` | `countBy`, `sumBy` |
| `engine/analyze.test.ts` | Vitest cho biên ngưỡng, ABC, Severe OOS, EOL, Core, Overstock |
| `store/analysisStore.ts` | `useAnalysisStore` (state: raw, sourceLabel, settings, category, actionFilter; actions: setData, updateSettings, setCategory, setActionFilter), `ALL_CATEGORIES` |

## Rules (theo `Nguyên tắc xây  dựng Analysis.md`, kèm cách hiểu đã chốt)

- ADS = Units / Selling Days; Selling Days = days - OOS days.
- ADS Index = ADS / ADS trung bình ngành hàng.
- ABC theo metric chọn (revenue/gp/units), SKU vào A khi tích luỹ TRƯỚC nó < cutA. Tính trên toàn bộ dữ liệu.
- Velocity ADS: ≥20 Fast, ≥15 Normal, >5 Slow, còn lại Very Slow (ngưỡng liên tục, lấp khe 5-6, 14-15, 19-20 của tài liệu).
- Velocity Index: ≥100% Fast, ≥70% Normal, ≥30% Slow.
- Core: A + ADS ≥ 20 + Index ≥ 70% + OOS ≤ 10% + không EOL.
- DOS: ≤7, ≤15, ≤30, ≤60, ≤90, >90. ADS = 0 và còn tồn → Infinity (Overstock); không tồn → N/A.
- OOS > 20%: Growth so kỳ trước bằng nhu cầu dự kiến (ADS x days).
- isNew = lifecycle New hoặc (unitsPrev = 0 và units > 0).
- Thứ tự Action: EOL → New → Seasonal → Severe OOS → switch DOS (N/A, Critical Low, Low, Overstock, Excess, High, Healthy).
- Nhóm Action: Tăng PO, Duy trì, Giảm PO, Stop PO / Xả hàng, Review. Mỗi nhánh trả `reasons[]`.

## Mở rộng

- Thêm tiêu chí mới (vd Lead Time): thêm field vào `SkuInput` + `COLUMNS` (import) → tính trong `metrics.ts` → phân loại trong `classify.ts` → dùng trong `actions.ts` → thêm test.
- Ngưỡng theo ngành hàng: đổi `THRESHOLDS` thành hàm `thresholdsFor(category)` rồi truyền vào classify.
