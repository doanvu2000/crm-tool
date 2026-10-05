# features/sku-pilot

Website dashboard riêng tại `/pilot.html` theo tài liệu Lark “Nguyên tắc xây dựng mô hình ABC Analysis & SKU Review”. Public API: `features/sku-pilot/index.ts`.

## File

| File | Trách nhiệm |
|---|---|
| `components/SkuPilotDashboard.vue` | Chọn nhiều tháng, bộ lọc chung và lọc chéo từ biểu đồ/bảng, KPI, box phân bố Fast/Slow/Non-moving theo ngành hàng, Category Overview có tìm kiếm/sắp xếp, SKU Detail có bộ lọc/phân trang và các cột Sales Qty theo kỳ chọn, Margin kèm Margin TB ngành, Stock Qty, Stock Value và Stockday; không sinh Action |
| `PilotApp.vue` | Root component của website Pilot, không dùng App.vue/router của website cũ |
| `components/PilotHeader.vue` | Header riêng, công tắc theme và liên kết quay về web SKU Analysis cũ |
| `composables/usePilotTheme.ts` | Theme và palette riêng theo `sku-pilot-theme`; cập nhật màu chart qua palette dùng chung mà không ghi preference `sku-theme` |
| `lib/pilotImport.ts` | Map alias cột dữ liệu 3 tháng và metadata ngành hàng con/loại cửa hàng/ngày có hàng/số bán theo tuần, tải template XLSX |
| `lib/sampleData.ts` | Dữ liệu mẫu cố định cho dashboard khi chạy lần đầu |
| `lib/pilotPersistence.ts` | Lưu bộ dữ liệu gần nhất riêng trong IndexedDB `crm-tool-sku-pilot` |

## Nghiệp vụ

- Engine thuần dùng `features/analysis/engine/pilotDashboard.ts`; kiểu đầu vào/kết quả nằm trong `features/analysis/model/types.ts`.
- `analyzePilotSkus` nhận danh sách M1/M2/M3 đang chọn; ABC, tổng bán/lãi, Margin và Stockday tính trên khoảng đó; Growth so sánh hai tháng chọn cuối, hoặc khi chỉ chọn một tháng thì so với tháng liền trước (M1 không có tháng trước nên Growth là N/A). Bộ lọc Category/ABC/Status, lọc chéo và bộ lọc SKU dùng chung cho toàn dashboard.
- Stockday = tồn kho hiện tại theo số lượng / (số bán trong các tháng chọn / 30 ngày kinh doanh cho mỗi tháng chọn). Ngưỡng phân nhóm hiện giữ ở 7/15/30/60 ngày; không còn tính DIO theo giá trị tồn và COGS.
- Ngưỡng theo Lark tập trung ở `PILOT_THRESHOLDS` trong `features/analysis/model/thresholds.ts`: ABC doanh số lũy kế 80/95%, Growth, Margin Index, Price Index và Stockday.
- Status chỉ là nhãn mô tả để xem/lọc; không có bảng Recommendation/Action.
- Sales motion dùng chung engine: Fast là top 25% ADS cùng ngành hàng con + loại cửa hàng, cần ít nhất 4 SKU đối chiếu; nếu có dữ liệu tuần thì SKU phải bán đều theo tuần. Slow có bán nhưng không đạt Fast. Non-moving dùng ngưỡng Ohmee theo số ngày có hàng, loại ngày chưa bày bán. New/Seasonal/Promotion và nhóm chưa đủ SKU đối chiếu được giữ `Unknown`. Box dashboard tổng hợp theo bộ lọc hiện hành, hiển thị ngưỡng Non-moving ở từng ngành hàng và cho lọc chéo.
- Data import chạy hoàn toàn trong trình duyệt; file hỗ trợ CSV/XLS/XLSX. Chọn nhiều tháng để cập nhật số tổng và các chỉ số theo kỳ; Growth dùng hai tháng được chọn gần nhất, hoặc tháng liền trước khi chỉ chọn một tháng. Bấm điểm doanh số để chọn một tháng. Dữ liệu tổng kỳ không có breakdown tháng sẽ khóa chọn tháng và Growth hiện N/A.
- Template Pilot tải xuống dạng XLSX để Excel mở mỗi trường thành một cột.
- Tìm kiếm và sắp xếp Category Overview theo Category, doanh số, Growth, Profit hoặc Stockday; SKU Detail tìm kiếm và lọc theo Category, ABC, Growth, Margin, Price, Stockday hoặc Status.
- Theme Pilot lưu trong `sku-pilot-theme`, tách khỏi `sku-theme` của web cũ; hai entry point dùng chung token sáng/tối.
- Phần tồn kho hiển thị phân bố Stockday và Sales Motion theo ngành hàng, sau đó là Category Overview.

## Entry point và dependency

- `pilot.html` nạp `src/pilot/main.ts` rồi mount `PilotApp.vue`; Vite build cả `index.html` hiện tại và `pilot.html`.
- Website cũ giữ nguyên `App.vue`, `AppHeader.vue`, `app/router.ts` và bootstrap. Pilot dùng header riêng, không có link từ trang cũ; dùng URL trực tiếp `/pilot.html`.
- Dashboard dùng `features/import` qua public API để đọc sheet, `features/analysis` qua public API cho engine/types, và `shared/charts`/`shared/ui` cho chart/token giao diện.
- Dữ liệu gần nhất của Pilot lưu trong IndexedDB tách biệt với workspace phân tích hiện tại.
