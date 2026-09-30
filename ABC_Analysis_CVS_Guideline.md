# Nguyên tắc ABC sản phẩm – Phiên bản đơn giản cho chuỗi CVS

## 1. Mục đích

ABC được sử dụng để trả lời 3 câu hỏi:

- **A – Sản phẩm nào phải luôn có hàng?**
- **B – Sản phẩm nào cần duy trì và phát triển?**
- **C – Sản phẩm nào cần xem xét giảm hoặc loại bỏ?**

ABC không nhằm đánh giá sản phẩm “tốt hay xấu”, mà để xác định **mức độ ưu tiên quản lý**.

---

## 2. Nguyên tắc tính

ABC được tính **trong từng ngành hàng/nhóm hàng**, không so sánh SKU của các ngành hàng khác nhau với nhau.

Sử dụng dữ liệu bán hàng **8 tuần gần nhất**.

### Chỉ số chính

**Sales = Doanh thu bán thực tế của SKU**

Nếu so sánh giữa các cửa hàng có quy mô khác nhau, sử dụng:

**Sales/Store/Week = Doanh thu ÷ Số cửa hàng có bán ÷ Số tuần**

Sau đó:

1. Sắp xếp SKU từ doanh thu cao nhất xuống thấp nhất.
2. Tính tỷ trọng doanh thu của từng SKU.
3. Tính tỷ trọng doanh thu tích lũy.
4. Phân nhóm A/B/C.

| Nhóm | Nguyên tắc | Ý nghĩa |
|---|---|---|
| **A** | SKU tạo ra 70% doanh thu đầu tiên | Sản phẩm quan trọng |
| **B** | SKU tạo ra 20% doanh thu tiếp theo | Sản phẩm cần duy trì/phát triển |
| **C** | SKU tạo ra 10% doanh thu cuối cùng | Sản phẩm cần xem xét |

---

## 3. Cách quản lý theo nhóm

| Nhóm | Cách hiểu đơn giản | Hành động |
|---|---|---|
| **A** | **Phải có** | Ưu tiên hàng hóa, hạn chế OOS, ưu tiên vị trí bán |
| **B** | **Nên có** | Duy trì, theo dõi và tìm cơ hội tăng bán |
| **C** | **Cân nhắc có** | Giảm tồn kho, giảm diện tích, xem xét delist |
| **New** | **Chưa đủ dữ liệu** | Cho thời gian test trước khi xếp ABC |

### A – PHẢI CÓ

Đây là nhóm tạo phần lớn doanh thu của ngành hàng.

**Nguyên tắc:**  
> Không để mất doanh số vì thiếu hàng A.

SKU A được ưu tiên về:

- Availability
- Tồn kho
- Shelf space
- Replenishment
- Theo dõi OOS

Nếu SKU A bán giảm mạnh, cần tìm nguyên nhân trước khi giảm listing.

### B – NÊN CÓ

Đây là nhóm có đóng góp trung bình và có khả năng phát triển.

**Nguyên tắc:**  
> Giữ nếu sản phẩm vẫn tạo giá trị và có khả năng tăng trưởng.

Cần theo dõi hướng dịch chuyển:

- **B → A:** sản phẩm đang tăng trưởng
- **B → C:** sản phẩm đang suy giảm

### C – CÂN NHẮC CÓ

Đây là nhóm đóng góp thấp.

**Nguyên tắc:**  
> SKU C phải chứng minh lý do để tiếp tục chiếm tồn kho và diện tích cửa hàng.

Khi một SKU liên tục ở nhóm C, có thể xem xét theo thứ tự:

**Giảm tồn kho → Giảm số cửa hàng bán → Giảm facing → Delist**

Không tự động delist chỉ vì SKU thuộc nhóm C.

---

## 4. Các trường hợp không áp dụng ABC máy móc

Một SKU không được giảm hoặc delist chỉ dựa trên ABC nếu thuộc một trong các trường hợp sau:

- **New Product:** sản phẩm mới chưa đủ thời gian bán.
- **Strategic Product:** sản phẩm chiến lược hoặc bắt buộc phải có.
- **Traffic Product:** sản phẩm khách hàng thường xuyên tìm mua dù margin thấp.
- **Seasonal Product:** sản phẩm có tính mùa vụ.
- **Promotion:** doanh số bị ảnh hưởng mạnh bởi chương trình khuyến mại.

Các SKU này cần được **gắn cờ riêng** trước khi đưa ra quyết định.

---

## 5. Chu kỳ review

ABC được cập nhật **mỗi tháng một lần**, sử dụng dữ liệu **rolling 8 tuần gần nhất**.

Không thay đổi listing chỉ vì SKU thay đổi ABC trong một kỳ.

Ưu tiên xem xu hướng:

| Xu hướng | Cách hiểu |
|---|---|
| **A → A** | Core Product |
| **B → A** | Growing Product |
| **A → B/C** | Declining Product |
| **C → C** | Delist Candidate |

SKU chỉ nên được xem xét delist khi:

- Nằm trong nhóm C liên tục qua nhiều kỳ;
- Không thuộc nhóm ngoại lệ;
- Không có vai trò chiến lược rõ ràng;
- Hiệu quả bán hàng và tồn kho thấp.

---

## 6. Quy tắc nhớ nhanh

### A = PHẢI CÓ

Bán mạnh → Ưu tiên hàng → Hạn chế OOS.

### B = NÊN CÓ

Bán trung bình → Duy trì → Tìm cơ hội phát triển.

### C = CÂN NHẮC CÓ

Bán thấp → Giảm đầu tư → Xem xét delist.

> **Một SKU C chưa chắc phải bỏ.**  
> **Một SKU A không được phép thường xuyên hết hàng.**

---

## 7. Logic vận hành đề xuất

Để mọi bộ phận sử dụng cùng một cách hiểu, áp dụng logic:

> **Sales quyết định ABC → ABC quyết định mức ưu tiên → Business Rule quyết định hành động cuối cùng.**

Ví dụ:

- SKU là **C nhưng là hàng chiến lược** → Không delist.
- SKU là **C liên tục 3 tháng**, không chiến lược, không seasonal, không phải hàng mới → Đưa vào danh sách review delist.
- SKU là **A nhưng OOS cao** → Ưu tiên xử lý tồn kho và replenishment.
- SKU từ **B lên A** → Xem xét tăng tồn, tăng listing hoặc shelf space.

---

## 8. Lưu ý khi áp dụng trong chuỗi CVS

Nên chạy ABC theo:

- **Category**
- Hoặc **Sub-category**

Không nên chạy một bảng ABC cho toàn bộ chuỗi vì các ngành hàng doanh thu lớn có thể chiếm toàn bộ nhóm A, làm mất ý nghĩa quản trị category.

Trong trường hợp cần quản lý sâu hơn, có thể triển khai ABC ở 3 cấp:

1. **Toàn chuỗi**
2. **Theo cluster cửa hàng**
3. **Theo từng cửa hàng**

Cùng một SKU có thể là A ở cluster này nhưng là B hoặc C ở cluster khác.

---

## 9. Nguyên tắc thiết kế mô hình

Mục tiêu của mô hình là **đơn giản, dễ hiểu, dễ áp dụng và nhất quán**.

Không nên bắt người dùng tính quá nhiều weighted score nếu không thực sự cần thiết.

Phiên bản nền tảng nên giữ:

- **1 chỉ số chính:** Sales
- **3 nhóm:** A / B / C
- **1 bảng hành động**
- **Một số ngoại lệ bắt buộc**

Sau khi tổ chức đã sử dụng ổn định, có thể mở rộng thêm các chỉ số như:

- Gross Profit
- Sales Qty
- Inventory Turnover
- OOS
- Margin
- Strategic Role

Nhưng các chỉ số này nên dùng để **bổ sung quyết định**, không làm mô hình nền tảng trở nên quá phức tạp.

---

## 10. Tóm tắt một dòng

> **A: Phải có – B: Nên có – C: Cân nhắc có. Sales xác định nhóm, business rule xác định hành động.**
