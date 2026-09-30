# Data flow

```
File .csv/.xlsx ─┐
                 ├─ import/lib/readSheet.ts (SheetJS lazy) → Record<string, unknown>[]
Dữ liệu mẫu ─────┤─ import/lib/sampleData.ts
                 └─ import/lib/mapRows.ts (alias cột, parseNum VN/EN) → SkuInput[]
                        │
                        ▼
        analysis/store/analysisStore.ts  (Pinia)
          state:   raw (shallowRef), original (bản file gốc), settings, category, sourceLabel
          actions: setData, updateRow, resetRow, resetAll, updateSettings (sanitizeSettings), setCategory
          getters: rows = analyzeSkus(raw, settings)   ← cache theo raw + settings
                   visibleRows = rows lọc theo category
                   categories, hasData
                   editedIndexes/editedCount (raw[i] !== original[i])
                   baselineRows = analyzeSkus(original) chỉ khi có sửa
                        │
                        ▼
        analysis/engine/analyze.ts
          1. metrics.ts   computeBaseMetrics: days, sellingDays, ADS, OOS rate, expectedDemand, growth, DOS
                          + comparePrevious: prevRevenue, revenueDelta/Growth, unitsDelta/Change, volumeEffect, priceEffect
          2. metrics.ts   categoryAverageAds → ADS Index
          3. abc.ts       assignAbc (Pareto theo metric, tính trên TOÀN BỘ dữ liệu)
          4. classify.ts  velocity, dosStatus, oosStatus, trendStatus, isCoreSku, isNew
          5. actions.ts   decideAction → group, action, reasons[]
                        │
                        ▼  SkuResult[] (xếp theo rank ABC)
        pages/SkuAnalysisPage.vue → truyền visibleRows xuống từng Section
          overview · contribution · inventory · actions · rules
                        │
                        ▼
        shared/charts/ChartCanvas.vue (config computed theo rows + palette)
```

## Luồng phụ

- Theme: `useTheme` (module-level ref) → class `.dark` trên `<html>` + localStorage `sku-theme`.
  `usePalette()` computed theo theme → mọi chart config recompute → `ChartCanvas` update tại chỗ.
  Script inline trong `index.html` set class trước khi mount để không nháy theme.
- Settings: ô số giữ draft, commit khi blur/Enter → `updateSettings` → store recompute rows.
- Xuất CSV: `actions/lib/exportCsv.ts` lấy danh sách đã lọc của bảng → `shared/lib/download.ts` (BOM UTF-8).
- Sửa input: `editor/components/CellInput.vue` giữ draft, commit sau 300ms / blur / Enter → `store.updateRow` → rows recompute → mọi section cập nhật. Sửa về đúng giá trị gốc thì dòng trở lại object gốc (không còn tính là đã sửa).
- Tour: `onboarding/composables/useTour.ts` (state module-level, localStorage `sku-tour` {intro, data}). `TourOverlay` tự chạy intro khi chưa có dữ liệu, tự chạy phase data khi `hasData` lần đầu. Điểm neo = attribute `data-tour="<tên>"`.
