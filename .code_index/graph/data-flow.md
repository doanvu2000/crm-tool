# Data flow

```
File .csv/.xlsx ─┐
                 ├─ import/lib/readSheet.ts (SheetJS lazy) → Record<string, unknown>[]
Dữ liệu mẫu ─────┤─ import/lib/sampleData.ts
                 └─ import/lib/mapRows.ts (alias cột, parseNum VN/EN) → SkuInput[] (category + subcat1 + subcat2 + storeType + ngày có hàng/chưa bày + tuần bán)
                        │
                        ▼
        analysis/store/analysisStore.ts  (Pinia)
          state:   raw (shallowRef), original (bản file gốc), removed (Set index), settings, selectedCategories, selectedSubcat1/2, sourceLabel
          actions: setData, restoreSavedData, updateRow, resetRow, removeRow, restoreRow, resetAll, updateSettings (sanitizeSettings), setCategories/setSubcat1/setSubcat2/toggleCategory/selectAllCategories
          getters: rows = analyzeSkus(raw, settings)   ← cache theo raw + settings
                   categoryRows = rows lọc theo category + selectedSubcat1 + selectedSubcat2
                   visibleRows = categoryRows lọc theo drill (lọc chéo)
                   crossRows[field] / matrixRows = bỏ drill của chính chart đó
                   categories, hasData
                   editedIndexes/editedCount (raw[i] !== original[i])
                   baselineRows = analyzeSkus(original) chỉ khi có sửa
                        │
                        ▼
        analysis/engine/analyze.ts
          1. metrics.ts   computeBaseMetrics: days, sellingDays, availableDays, ADS, OOS rate, expectedDemand, growth, DOS
                          + comparePrevious: prevRevenue, revenueDelta/Growth, unitsDelta/Change, volumeEffect, priceEffect
          2. metrics.ts   categoryAverageAds → ADS Index
          3. abc.ts       assignAbcByCategory (Pareto Sales, xếp độc lập trong từng ngành hàng)
          4. classify.ts  velocity, salesMotion Fast/Slow/Non-moving, dosStatus, oosStatus, trendStatus, isCoreSku, isNew
          5. actions.ts   decideAction → group, action, reasons[]
                        │
                        ▼  SkuResult[] (xếp theo rank ABC)
        pages/SkuAnalysisPage.vue → truyền visibleRows xuống từng Section
          overview · contribution · inventory · actions · rules
                        │
                        ▼
        shared/charts/ChartCanvas.vue (config computed theo rows + palette)
```

Pipeline tương đương trong Excel: bảng `SkuInput` → `power-query/SkuAnalysis.pq` → một bảng kết quả chứa metrics, ABC, classification và Action. Query chạy độc lập với SPA; các thiết lập nằm ở đầu query.

Lịch sử doanh thu theo tháng có luồng riêng, không đi qua engine phân tích SKU:

```
File .csv/.xlsx/.xls (month, store, sku, revenue, units)
  → import/readSheet → monthly-sales/lib/mapMonthlySales
  → monthly-sales/store (shallowRef + IndexedDB cục bộ)
  → tổng doanh thu theo tháng/cửa hàng đã chọn
  → monthly-sales/components/MonthlySalesSection → ChartCanvas (line)
```

`monthly-sales/store` phục hồi lịch sử đã nhập khi section được mount; danh sách cửa hàng được chọn lại mặc định.

Dashboard Pilot là website tĩnh riêng tại `/pilot.html`; không dùng store phân tích hiện tại:

```
CSV/XLS/XLSX hoặc dữ liệu mẫu
  → import/readSheet → sku-pilot/lib/pilotImport → PilotSkuInput[]
  → selectedMonths → analysis/engine/pilotDashboard (ABC → Growth → Margin → Price → Stockday → Fast/Slow/Non-moving → Status)
  → filter chung / lọc chéo từ chart và bảng → KPI, biểu đồ, box Sales Motion tổng hợp Fast/Slow/Non-moving theo ngành hàng, Category Overview tìm/sắp xếp, SKU Detail lọc/phân trang
  ↔ IndexedDB crm-tool-sku-pilot/workspace/latest
```

Luồng này chỉ tính và hiển thị chỉ số/trạng thái theo tài liệu Lark; Stockday lấy tồn hiện tại theo số lượng chia cho lượng bán bình quân ngày trong khoảng chọn, quy ước 30 ngày kinh doanh mỗi tháng. Không có DIO, Action hoặc recommendation. Theme Pilot dùng `sku-pilot-theme` và palette chung.

Khi nạp dữ liệu hoặc sửa/xoá dòng, store lưu bản phân tích gần nhất vào IndexedDB cục bộ. `main.ts` khôi phục bản này trước khi mount ứng dụng; nếu bộ nhớ trình duyệt không khả dụng, app tiếp tục chạy với state trống. Settings cũng được giữ lại cùng dữ liệu, còn filter hiển thị được khởi tạo lại mặc định.

## Luồng phụ

- Theme: `useTheme` (module-level ref) → class `.dark` trên `<html>` + localStorage `sku-theme`.
  `usePalette()` computed theo theme → mọi chart config recompute → `ChartCanvas` update tại chỗ.
  Script inline trong `index.html` set class trước khi mount để không nháy theme.
- Settings: chuẩn ABC CVS cố định (Sales, 56 ngày, 70/90); chọn basis tốc độ bán → `updateSettings` → store recompute rows.
- Xuất CSV: `actions/lib/exportCsv.ts` lấy danh sách đã lọc của bảng → `shared/lib/download.ts` (BOM UTF-8).
- Sửa input: `editor/components/CellInput.vue` giữ draft, commit sau 300ms / blur / Enter → `store.updateRow` → rows recompute → mọi section cập nhật. Sửa về đúng giá trị gốc thì dòng trở lại object gốc (không còn tính là đã sửa).
- Ngành hàng: Import map `category`, `subcat1`, `subcat2` vào `SkuInput`; `CategoryFilter` cung cấp ba select phân cấp, store lọc `categoryRows`, rồi toàn bộ KPI/chart/bảng dùng tập SKU đó. File cũ có thể bỏ trống hai cột Subcat.
- Tour: `onboarding/composables/useTour.ts` (state module-level, localStorage `sku-tour` {intro, data}). `TourOverlay` tự chạy intro khi chưa có dữ liệu, tự chạy phase data khi `hasData` lần đầu. Điểm neo = attribute `data-tour="<tên>"`.
