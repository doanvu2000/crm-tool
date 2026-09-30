# Data flow

```text
File .csv/.xlsx/.xls (month, store, sku, category, revenue, units, gp, stock, oos_days, ...)
  → import/readSheet → monthly-sales/lib/mapMonthlySales
  → monthly-sales/store (shallowRef + IndexedDB cục bộ)
      ├─ dữ liệu đã chọn → MonthlySalesSection → ChartCanvas (line theo tháng/cửa hàng)
      └─ tháng chọn + cửa hàng chọn → monthly-sales/lib/toAnalysisInputs
          → analysis/store/setDerivedData (cộng gộp theo SKU; tháng liền trước làm baseline)
          → analysis/engine/analyze → KPI / chart / bảng / Action
```

`monthly-sales/store` phục hồi file đã nhập khi section được mount; tháng mới nhất và toàn bộ cửa hàng được chọn mặc định. Tồn kho được cộng giữa cửa hàng; số ngày OOS được lấy bình quân theo cửa hàng, còn số ngày kỳ theo lịch tháng để giữ đúng ADS/OOS khi gộp.

Khi nạp dữ liệu hoặc sửa/xoá dòng, store lưu bản phân tích gần nhất vào IndexedDB cục bộ. `main.ts` khôi phục bản này trước khi mount ứng dụng; nếu bộ nhớ trình duyệt không khả dụng, app tiếp tục chạy với state trống. Settings cũng được giữ lại cùng dữ liệu, còn filter hiển thị được khởi tạo lại mặc định.

## Luồng phụ

- Theme: `useTheme` (module-level ref) → class `.dark` trên `<html>` + localStorage `sku-theme`. `usePalette()` computed theo theme → mọi chart config recompute → `ChartCanvas` update tại chỗ. Script inline trong `index.html` set class trước khi mount để không nháy theme.
- Settings: chuẩn ABC CVS cố định; tháng trong file là kỳ hiện tại, tháng liền trước làm baseline → `updateSettings` → store recompute rows.
- Xuất CSV: `actions/lib/exportCsv.ts` lấy danh sách đã lọc của bảng → `shared/lib/download.ts` (BOM UTF-8).
- Sửa input: `editor/components/CellInput.vue` giữ draft, commit sau 300ms / blur / Enter → `store.updateRow` → rows recompute → mọi section cập nhật. Sửa về đúng giá trị gốc thì dòng trở lại object gốc (không còn tính là đã sửa).
- Ngành hàng: `monthly-sales/lib/mapMonthlySales` đưa `category`, `subcat1`, `subcat2` vào `SkuInput`; `CategoryFilter` cung cấp ba select phân cấp, store lọc `categoryRows`, rồi toàn bộ KPI/chart/bảng dùng tập SKU đó. File có thể bỏ trống hai cột Subcat.
- Tour: `onboarding/composables/useTour.ts` (state module-level, localStorage `sku-tour` {intro, data}). `TourOverlay` tự chạy intro khi chưa có dữ liệu, tự chạy phase data khi `hasData` lần đầu. Điểm neo = attribute `data-tour="<tên>"`.
