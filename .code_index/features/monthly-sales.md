# Feature monthly-sales

Nhập và xem lịch sử doanh thu theo tháng, tách theo cửa hàng; luồng độc lập với phân tích SKU theo kỳ.

| File | Trách nhiệm |
|---|---|
| `components/MonthlySalesSection.vue` | Tải file lịch sử, chọn nhiều cửa hàng bằng checkbox, hiển thị doanh thu theo tháng bằng line chart qua `ChartCanvas` |
| `model/types.ts` | `MonthlySaleInput`: tháng chuẩn `YYYY-MM`, cửa hàng, SKU, doanh thu, số lượng |
| `lib/importMonthlySales.ts` | `mapMonthlySales`, `MonthlySalesImportError`; ánh xạ cột CSV/XLSX và tổng hợp định dạng tháng |
| `lib/template.ts` | Tải file CSV mẫu `month, store, sku, revenue, units` |
| `store/monthlySalesStore.ts` | Shallow state cho lịch sử, nguồn file, danh sách cửa hàng và lựa chọn; phục hồi dữ liệu cục bộ |
| `store/monthlySalesPersistence.ts` | Lưu/đọc lịch sử riêng trong IndexedDB trên trình duyệt |

Public API: `MonthlySalesSection`, `mapMonthlySales`, `MonthlySalesImportError`, `MonthlySaleInput`, `useMonthlySalesStore`.
