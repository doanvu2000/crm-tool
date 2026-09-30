# Feature monthly-sales

Nguồn dữ liệu chung cho biểu đồ và mọi bảng phân tích. Mỗi dòng là một SKU tại một cửa hàng trong một tháng. Tháng chọn tạo kỳ hiện tại; dữ liệu tháng liền trước tạo số so sánh. Chọn nhiều cửa hàng sẽ cộng doanh thu, số lượng, GP và tồn theo SKU; OOS days dùng bình quân theo cửa hàng để giữ đúng tỷ lệ OOS và ADS.

| File | Trách nhiệm |
|---|---|
| `components/MonthlySalesSection.vue` | Tải nguồn dữ liệu chung, chọn tháng phân tích và nhiều cửa hàng, hiển thị doanh thu lịch sử bằng line chart |
| `model/types.ts` | `MonthlySaleInput`: tháng `YYYY-MM`, cửa hàng, SKU, ngành, doanh thu, số lượng, GP, tồn cuối tháng, ngày OOS và thuộc tính SKU |
| `lib/importMonthlySales.ts` | `mapMonthlySales`, `MonthlySalesImportError`; ánh xạ file và kiểm tra các cột bắt buộc |
| `lib/toAnalysisInputs.ts` | `toAnalysisInputs`; cộng gộp SKU theo tháng/cửa hàng đã chọn, nối tháng trước để phân tích |
| `lib/template.ts` | Tải file CSV mẫu đầy đủ dữ liệu bán, lợi nhuận, tồn kho và phân loại |
| `store/monthlySalesStore.ts` | Shallow state nguồn, tháng/cửa hàng chọn và phục hồi dữ liệu cục bộ |
| `store/monthlySalesPersistence.ts` | Lưu/đọc nguồn lịch sử trong IndexedDB trên trình duyệt |

Public API: `MonthlySalesSection`, `mapMonthlySales`, `MonthlySalesImportError`, `toAnalysisInputs`, `MonthlySaleInput`, `useMonthlySalesStore`.
