# Nguyên tắc xây  dựng Analysis

### 1\. Nguyên tắc xây dựng mô hình

- SKU là đơn vị phân tích cơ bản

- Tất cả SKU phải được đánh giá trên cùng một kỳ dữ liệu và cùng định nghĩa KPI\.

- ABC được sử dụng để đo mức độ đóng góp\.

- Các SKU có dữ liệu bất thường như New SKU, OOS, Seasonal, EOL phải được xử lý qua Exception Rule trước khi kết luận\.

- Không tăng hoặc giảm PO chỉ dựa trên ABC; Action phải dựa trên ABC kết hợp Demand, Inventory, Trend, Lead Time và Lifecycle\.

- Mọi Action phải truy xuất được về điều kiện số liệu đã kích hoạt Rule\.

- Threshold trong giai đoạn Pilot là baseline và phải được hiệu chỉnh theo dữ liệu thực tế từng ngành hàng\.

### 2\. Cấu trúc đánh giá SKU

|**Tiêu chí đánh giá**|**KPI / tiêu chí**|**Mục đích**|
|---|---|---|
|Đóng góp|Doanh thu/Gp/Doanh số|Xác định mức độ đóng góp của SKU|
|Tốc độ bán hàng|Số lượng Tb/ngày; Sales Days/30D|Xác định Fast / Normal / Slow / Very Slow|
|Hàng tồn kho|Current Stock; DOS / Stock Cover|Xác định thiếu hàng, dư hoặc overstock|
|Xu hướng mua hàng<br>|Current 30D vs Previous 30D|Xác định tăng trưởng, ổn định hoặc suy giảm|
|OOS|OOS Rate|Phân biệt bán chậm thật với bán thấp do thiếu hàng|
|Lifecycle|New / Active / EOL|Đưa sản phẩm về đúng bối cảnh vòng đời|

### 3\. ABC Classification

ABC nên được giữ như lớp phân loại đóng góp theo Pareto\. Baseline đề xuất:

|**Class**|**Tỷ lệ đóng góp**|**Ý nghĩa**|
|---|---|---|
|A|80%|Nhóm đóng góp cao, cần ưu tiên theo dõi|
|B|15%|Nhóm đóng góp trung bình|
|C|5%|Nhóm đóng góp thấp|

### 4\. Tốc độ bán hàng

Công thức:

Số bán bình quân ngày: ADS = Units Sold/Selling Days

Tốc độ bán của 1 sản phẩm/ngành: ADS Index = SKU ADS / Category ADS

|**Trạng thái**|**ADS**|**ADS Index**|**Định hướng**|
|---|---|---|---|
|Fast|≥20|≥100%|Ưu tiên availability \& Bổ sung|
|Normal|15–19|70–100%|Bình thường|
|Slow|6–14|30–70%|Kiểm soát PO và tồn kho|
|Very Slow|≤5|\<30%|Review / promotion / exit|

### 5\. Core SKU

Core SKU được định nghĩa

|**Điều kiện**|**Ngưỡng Pilot**|
|---|---|
|ABC|A|
|ADS|Fast|
|ADS Index|Normal|
|OOS Rate|≤10%|

Core SKU là nhóm cần bảo vệ availability và được ưu tiên forecast, replenishment, safety stock và supplier SLA\.

### Tình trạng tồn kho – DOS Stock Cover

Số ngày tồn kho: DOS = Current Stock/Average Daily Sales

|**DOS**|**Trạng thái**|**Định hướng**|
|---|---|---|
|≤7 ngày|Critical Low|Urgent replenishment|
|8–15 ngày|Low|Ưu tiên PO|
|16–30 ngày|Healthy|Duy trì|
|31–60 ngày|High|Kiểm soát |
|61–90 ngày|Excess|Giảm PO \+ kích cầu|
|\>90 ngày|Overstock|Stop PO / clearance / exit|

Ngưỡng trên là baseline cho Pilot; khi vận hành chính thức cần hiệu chỉnh theo lead time, order cycle và đặc thù từng ngành hàng\.

### 7\. OOS 

OOS Rate = OOS Days / Total Days\. Nếu OOS cao, sales thực tế có thể thấp do thiếu hàng và không phản ánh đúng nhu cầu\.

|**OOS Rate**|**Trạng thái**|**Action**|
|---|---|---|
|0–5%|Healthy|Đánh giá sales bình thường|
|5–10%|Warning|Theo dõi availability|
|10–20%|Critical|Review replenishment|
|\>20%|Severe OOS|Tính lại nhu cầu dự kiến trước khi đánh giá|

Nhu cầu dự kiến = Số bán/số ngày có hàng \* Kì báo cáo

### 8\. Xu hướng bán hàng

Tăng trưởng = \(số bán hiện tại \- số bán cùng kì\)/số bán cùng kì

|**Growth**|**Demand Trend**|**Định hướng**|
|---|---|---|
|\> \+20%|Strong Growth|Tăng forecast / supply capacity|
|\+5% đến \+20%|Growth|Theo dõi và tăng supply phù hợp|
|\-5% đến \+5%|Stable|Duy trì|
|\-20% đến \-5%|Decline|Giảm forecast / PO|
|\< \-20%|Sharp Decline|Giảm PO mạnh; review lifecycle / clearance|

### 9\. Action 



