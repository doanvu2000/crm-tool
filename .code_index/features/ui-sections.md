# Feature UI sections

Tất cả nhận `rows: readonly SkuResult[]` (đã lọc ngành) từ `pages/SkuAnalysisPage.vue`.

## settings
- `components/SettingsPanel.vue`: select metric/basis commit ngay; ô số (kỳ, cutA, cutB) giữ draft, commit khi blur/Enter.

## overview
- `components/DecisionHero.vue`: thẻ quyết định (điểm nhấn), nhận `crossRows.group`, emit `pick(group)` → page `toggleDrill('group')` + cuộn tới #actions.
- `components/DrillBar.vue`: thanh "Đang lọc" (chip ngành + chip drill, số SKU còn lại, Xoá lọc). Page đặt sticky: desktop thanh riêng top-16, mobile nằm dưới SectionNav bar.
- `components/CategoryFilter.vue`: chip ngành, `store.setCategory`.
- `components/KpiGrid.vue`: 6 tile (Doanh thu + % so kỳ trước, Tổng SKU, SKU class A, Core, Dư tồn DOS > 60, OOS TB).
- `components/PeriodCompare.vue` (#compare): số lượng + doanh thu kỳ trước → kỳ này, tách thay đổi doanh thu do số lượng / do giá (nút ⓘ `compareEffects`), bảng theo ngành chỉ còn cột Số lượng + Doanh thu, top 5 SKU giảm doanh thu.

## contribution
- `components/ContributionSection.vue`: layout 12 cột.
- `ParetoChart.vue`: bar tích luỹ %, màu theo class ABC, 1 trục (không dual axis).
- `AbcMixChart.vue`: % số SKU vs % đóng góp. Nhận `crossRows.abc`, bấm class → `toggleDrill('abc')`.
- `AbcVelocityMatrix.vue`: bảng heat ABC x Velocity, ô A-Fast viền teal (`outline-tag`). Ô là button, bấm → `setDrillPair({ abc, velocity })`.
- `ExceptionsPanel.vue`: New / EOL / Seasonal / Severe OOS.

## inventory
- `components/InventorySection.vue`: 4 `CountBarChart` pickable (đếm từ `crossRows.<field>`, bấm cột → `toggleDrill`) + scatter.
- `DosGrowthScatter.vue`: DOS (kẹp 120) x Growth (kẹp -100..200%), plugin `guideLines` vẽ ngưỡng DOS.

## actions
- `components/ActionSection.vue`: `CountBarChart` ngang full width (pickable theo group), `SkuTable` full width bên dưới (bảng cần đủ ngang).
- `SkuTable.vue`: mã SKU là button mở `SkuTrace` (rules). Ô Doanh thu có dòng phụ % so kỳ trước (title = doanh thu kỳ trước). Tìm kiếm, lọc nhóm, sort (aria-sort), phân trang, xuất CSV. Desktop (≥ sm): bảng 10 cột, ngành gộp vào ô SKU. Mobile: danh sách thẻ + select sắp xếp.
- `composables/useSkuTable.ts`: `useSkuTable(rowsRef, actionFilterRef)` (actionFilter lấy từ store để hero điều khiển được), `PAGE_SIZE`, `SortKey`.
- `lib/exportCsv.ts`: `exportAnalysisCsv(rows)` (có cột doanh thu kỳ trước, chênh lệch, do số lượng, do giá).

## rules
- `components/RulesPanel.vue`: `<details>` mô tả rule (text từ `lib/methods.ts`, gồm So với kỳ trước, New SKU) + bảng `ACTION_RULES` kèm số SKU đang khớp từng Rule.
- `components/MethodInfo.vue`: nút "Cách tính" (`InfoPopover`), prop `topic`, đọc settings + số SKU + ngành từ store.
- `components/SkuTrace.vue`: `<dialog>` từng bước tính 1 SKU (`lib/trace.ts` `traceSku`).
- `lib/methods.ts`: `methodNote(topic, ctx)` cho 16 topic (decision, kpi, compare, compareEffects, pareto, abcMix, matrix, exceptions, velocity, dos, oos, trend, scatter, actionBar, skuTable, editor) + text rule dùng chung (`abcRule`, `dosRule`...).
- `lib/trace.ts`: `traceSku(row, settings, categoryAds)` → các bước Kỳ, ADS, Index, ABC, DOS, OOS, Growth, Core (checks), nhóm xét trước, Rule quyết định.
- Card nào có nút Cách tính: gắn `<template #info><MethodInfo topic="..." /></template>` vào `BaseCard` / `CountBarChart`.

## Thêm section mới
1. Tạo `src/features/<tên>/components/<Tên>Section.vue` + `index.ts`.
2. Chart dùng `ChartCanvas` + config `computed` phụ thuộc `usePalette()`; chart đếm dùng `CountBarChart`.
3. Ghép vào `pages/SkuAnalysisPage.vue`, thêm mục ở file này và `graph/modules.md`.
