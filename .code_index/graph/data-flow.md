# Data flow

```
File .csv/.xlsx ─┐
                 ├─ import/lib/readSheet.ts (SheetJS lazy) → Record<string, unknown>[]
Dữ liệu mẫu ─────┤─ import/lib/sampleData.ts
                 └─ import/lib/mapRows.ts (alias cột, parseNum VN/EN) → SkuInput[]
                        │
                        ▼
        analysis/store/analysisStore.ts  (Pinia)
          state:   raw (shallowRef), original (bản file gốc), removed (Set index), settings, selectedCategories, sourceLabel
          actions: setData, restoreSavedData, updateRow, resetRow, removeRow, restoreRow, resetAll, updateSettings (sanitizeSettings), setCategories/toggleCategory/selectAllCategories
          getters: rows = analyzeSkus(raw, settings)   ← cache theo raw + settings
                   categoryRows = rows lọc theo selectedCategories (mảng rỗng = tổng tất cả ngành)
                   visibleRows = categoryRows lọc theo drill (lọc chéo)
                   crossRows[field] / matrixRows = bỏ drill của chính chart đó
                   categories, hasData
                   editedIndexes/editedCount (raw[i] !== original[i])
                   baselineRows = analyzeSkus(original) chỉ khi có sửa
                        │
                        ▼
        analysis/engine/analyze.ts
          1. metrics.ts   computeBaseMetrics: days, sellingDays, ADS, OOS rate, expectedDemand, growth, DOS
                          + comparePrevious: prevRevenue, revenueDelta/Growth, unitsDelta/Change, volumeEffect, priceEffect
          2. metrics.ts   categoryAverageAds → ADS Index
          3. abc.ts       assignAbcByCategory (Pareto Sales, xếp độc lập trong từng ngành hàng)
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

Khi nạp dữ liệu hoặc sửa/xoá dòng, store lưu bản phân tích gần nhất vào IndexedDB cục bộ. `main.ts` khôi phục bản này trước khi mount ứng dụng; nếu bộ nhớ trình duyệt không khả dụng, app tiếp tục chạy với state trống. Settings cũng được giữ lại cùng dữ liệu, còn filter hiển thị được khởi tạo lại mặc định.

## Luồng phụ

- Theme: `useTheme` (module-level ref) → class `.dark` trên `<html>` + localStorage `sku-theme`.
  `usePalette()` computed theo theme → mọi chart config recompute → `ChartCanvas` update tại chỗ.
  Script inline trong `index.html` set class trước khi mount để không nháy theme.
- Settings: chuẩn ABC CVS cố định (Sales, 56 ngày, 70/90); chọn basis tốc độ bán → `updateSettings` → store recompute rows.
- Xuất CSV: `actions/lib/exportCsv.ts` lấy danh sách đã lọc của bảng → `shared/lib/download.ts` (BOM UTF-8).
- Sửa input: `editor/components/CellInput.vue` giữ draft, commit sau 300ms / blur / Enter → `store.updateRow` → rows recompute → mọi section cập nhật. Sửa về đúng giá trị gốc thì dòng trở lại object gốc (không còn tính là đã sửa).
- Tour: `onboarding/composables/useTour.ts` (state module-level, localStorage `sku-tour` {intro, data}). `TourOverlay` tự chạy intro khi chưa có dữ liệu, tự chạy phase data khi `hasData` lần đầu. Điểm neo = attribute `data-tour="<tên>"`.
