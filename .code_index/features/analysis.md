# features/analysis (domain)

Trái tim nghiệp vụ. Engine thuần TS + Pinia store. Public API: `features/analysis/index.ts`.

## File

| File | Trách nhiệm |
|---|---|
| `model/types.ts` | Hằng thứ tự (`ABC_CLASSES`, `VELOCITY_LEVELS`, `DOS_LEVELS`, `OOS_LEVELS`, `TREND_LEVELS`, `ACTION_GROUPS`, `LIFECYCLES`) + type `SkuInput` (có `category`, `subcat1?`, `subcat2?`), `AnalysisSettings`, kết quả engine cũ và `PilotSkuInput`/`PilotSkuResult` (Margin, Margin trung bình Category và Stockday) cho dashboard 3 tháng |
| `model/actionRules.ts` | `ACTION_RULES` (id, stage, when, group, action) theo đúng thứ tự xét, `ActionRuleId`, `ACTION_RULE_BY_ID`. `decideAction` lấy group/action từ đây nên bảng Quy tắc luôn khớp engine |
| `model/thresholds.ts` | `THRESHOLDS` và `DEFAULT_SETTINGS` ABC CVS (56 ngày, A 70%, B 90%), `PILOT_THRESHOLDS` riêng cho dashboard `/pilot` theo Lark (ABC 80/95%, Growth, Margin Index, Price Index, Stockday), `sanitizeSettings` |
| `engine/metrics.ts` | `computeBaseMetrics`, `comparePrevious`, `categoryAverageAds` |
| `engine/abc.ts` | `salesValue`, `assignAbc`, `assignAbcByCategory` (Pareto theo Sales riêng từng ngành) |
| `engine/classify.ts` | `velocityByAds`, `velocityByIndex`, `dosStatus`, `oosStatus`, `trendStatus`, `isCoreSku` |
| `engine/actions.ts` | `decideAction` (rule engine), trả `rule` id + group + action + reasons |
| `engine/analyze.ts` | `analyzeSkus` pipeline |
| `engine/pilotDashboard.ts` | `analyzePilotSkus(rows, selectedMonths?)`: tính ABC, Growth giữa hai tháng chọn cuối hoặc giữa tháng chọn duy nhất và tháng liền trước, Margin, Price, Stockday theo số ngày kỳ chọn và nhãn Status; không tính DIO hoặc Action |
| `engine/aggregate.ts` | `countBy`, `sumBy` |
| `engine/analyze.test.ts` | Vitest cho biên ngưỡng, ABC, Severe OOS, EOL, Core, Overstock và lọc đa ngành / tổng tất cả ngành |
| `store/analysisStore.ts` | `useAnalysisStore` (state: raw, original, removed, sourceLabel, settings, selectedCategories, selectedSubcat1, selectedSubcat2, actionFilter; drill; getters: activeRaw, rows, categoryRows (lọc theo 3 cấp ngành hàng), visibleRows, crossRows, matrixRows, hasDrill, editedIndexes, editedCount, removedCount, baselineRows; actions: setData, restoreSavedData, updateRow, resetRow, removeRow, restoreRow, resetAll, updateSettings, setCategories, setSubcat1, setSubcat2, toggleCategory, selectAllCategories, setActionFilter, setDrill, toggleDrill, setDrillPair, clearDrill). `selectedCategories` rỗng nghĩa là tổng tất cả ngành; thay đổi dữ liệu và settings được lưu cục bộ |
| `store/analysisPersistence.ts` | Lưu và đọc bản phân tích gần nhất từ IndexedDB trên trình duyệt, gồm dữ liệu gốc, sửa/xoá, nhãn nguồn và settings |

## Rules (theo `Nguyên tắc xây  dựng Analysis.md`, kèm cách hiểu đã chốt)

- ADS = Units / Selling Days; Selling Days = days - OOS days.
- ADS Index = ADS / ADS trung bình ngành hàng.
- ABC CVS chỉ theo Sales (doanh thu bán thực tế) của rolling 8 tuần. Xếp riêng trong từng ngành hàng; SKU vào A khi tích luỹ TRƯỚC nó < 70%, B khi < 90%, còn lại C.
- ABC xác định mức ưu tiên quản lý: A Phải có, B Nên có, C Cân nhắc có. Business rule mới quyết định action cuối cùng; C không tự động là delist.
- Velocity ADS: ≥20 Fast, ≥15 Normal, >5 Slow, còn lại Very Slow (ngưỡng liên tục, lấp khe 5-6, 14-15, 19-20 của tài liệu).
- Velocity Index: ≥100% Fast, ≥70% Normal, ≥30% Slow.
- Core: A + ADS ≥ 20 + Index ≥ 70% + OOS ≤ 10% + không EOL.
- DOS: ≤7, ≤15, ≤30, ≤60, ≤90, >90. ADS = 0 và còn tồn → Infinity (Overstock); không tồn → N/A.
- OOS > 20%: Growth so kỳ trước bằng nhu cầu dự kiến (ADS x days).
- Kỳ trước: prevRevenue = revenuePrev, thiếu (≤ 0) mà có unitsPrev thì = unitsPrev x giá kỳ này (`prevRevenueEstimated`).
  volumeEffect = (units - unitsPrev) x giá kỳ trước; priceEffect = revenueDelta - volumeEffect. Ước tính thì priceEffect = 0.
- isNew = lifecycle New hoặc (unitsPrev = 0 và units > 0).
- Thứ tự Action: EOL → New → Seasonal → Severe OOS → switch DOS (N/A, Critical Low, Low, Overstock, Excess, High, Healthy).
- Nhóm Action: Tăng PO, Duy trì, Giảm PO, Stop PO / Xả hàng, Review. Mỗi nhánh trả `reasons[]`.

Dashboard Pilot có hồ sơ ngưỡng riêng `PILOT_THRESHOLDS`, theo tài liệu Lark ABC Analysis & SKU Review. Các ngưỡng này không đổi chuẩn ABC CVS của ứng dụng hiện tại. Chi tiết luồng ở `features/sku-pilot.md`.

## Mở rộng

- Thêm tiêu chí mới (vd Lead Time): thêm field vào `SkuInput` + `COLUMNS` (import) → tính trong `metrics.ts` → phân loại trong `classify.ts` → dùng trong `actions.ts` → thêm test.
- Ngưỡng theo ngành hàng: đổi `THRESHOLDS` thành hàm `thresholdsFor(category)` rồi truyền vào classify.

## Lọc chéo (drill)

- `drill`: `{ group?, abc?, velocity?, dosStatus?, oosStatus?, trend? }`, AND với nhau và với `category`.
- `visibleRows` = category + mọi drill. `crossRows[field]` = category + drill trừ chính field đó: chart sở hữu field vẫn hiện đủ cột, cột đang chọn đậm, cột khác mờ.
- `matrixRows` bỏ cả abc + velocity. ABC vẫn tính trên tập dữ liệu đã nạp, nhưng Pareto/rank được tách độc lập theo ngành hàng; drill chỉ lọc hiển thị.
- Sửa/thêm field lọc: thêm vào `DRILL_FIELDS` + `DRILL_LABEL`, chart gọi `store.toggleDrill(field, value)`.
