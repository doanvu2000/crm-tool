# Feature UI sections

Tất cả nhận `rows: readonly SkuResult[]` (đã lọc ngành) từ `pages/SkuAnalysisPage.vue`.

## settings
- `components/SettingsPanel.vue`: select metric/basis commit ngay; ô số (kỳ, cutA, cutB) giữ draft, commit khi blur/Enter.

## overview
- `components/DecisionHero.vue`: thẻ quyết định (điểm nhấn), emit `pick(group)` → page set `store.actionFilter` + cuộn tới #actions.
- `components/CategoryFilter.vue`: chip ngành, `store.setCategory`.
- `components/KpiGrid.vue`: 6 tile (Doanh thu + % so kỳ trước, Tổng SKU, SKU class A, Core, Dư tồn DOS > 60, OOS TB).
- `components/PeriodCompare.vue` (#compare): số lượng + doanh thu kỳ trước → kỳ này, tách thay đổi doanh thu do số lượng / do giá, bảng theo ngành, top 5 SKU giảm doanh thu.

## contribution
- `components/ContributionSection.vue`: layout 12 cột.
- `ParetoChart.vue`: bar tích luỹ %, màu theo class ABC, 1 trục (không dual axis).
- `AbcMixChart.vue`: % số SKU vs % đóng góp.
- `AbcVelocityMatrix.vue`: bảng heat ABC x Velocity, ô A-Fast viền teal (`outline-tag`).
- `ExceptionsPanel.vue`: New / EOL / Seasonal / Severe OOS.

## inventory
- `components/InventorySection.vue`: 4 `CountBarChart` (velocity, dos, oos, trend) + scatter.
- `DosGrowthScatter.vue`: DOS (kẹp 120) x Growth (kẹp -100..200%), plugin `guideLines` vẽ ngưỡng DOS.

## actions
- `components/ActionSection.vue`: `CountBarChart` ngang full width, `SkuTable` full width bên dưới (bảng cần đủ ngang).
- `SkuTable.vue`: ô Doanh thu có dòng phụ % so kỳ trước (title = doanh thu kỳ trước). Tìm kiếm, lọc nhóm, sort (aria-sort), phân trang, xuất CSV. Desktop (≥ sm): bảng 10 cột, ngành gộp vào ô SKU. Mobile: danh sách thẻ + select sắp xếp.
- `composables/useSkuTable.ts`: `useSkuTable(rowsRef, actionFilterRef)` (actionFilter lấy từ store để hero điều khiển được), `PAGE_SIZE`, `SortKey`.
- `lib/exportCsv.ts`: `exportAnalysisCsv(rows)` (có cột doanh thu kỳ trước, chênh lệch, do số lượng, do giá).

## rules
- `components/RulesPanel.vue`: `<details>` mô tả rule, sinh text từ `THRESHOLDS` + settings.

## Thêm section mới
1. Tạo `src/features/<tên>/components/<Tên>Section.vue` + `index.ts`.
2. Chart dùng `ChartCanvas` + config `computed` phụ thuộc `usePalette()`; chart đếm dùng `CountBarChart`.
3. Ghép vào `pages/SkuAnalysisPage.vue`, thêm mục ở file này và `graph/modules.md`.
