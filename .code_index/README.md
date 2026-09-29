# Code Index: crm-tool

Bản đồ kiến trúc gọn để đọc trước khi sửa code. Đọc theo thứ tự:

1. `overview.md`: stack, lệnh, cây thư mục, quy tắc tầng.
2. `graph/data-flow.md`: dữ liệu đi từ file người dùng tới chart/bảng.
3. `graph/modules.md`: ai import ai, luật phụ thuộc.
4. `design.md`: token màu, font, điểm nhấn, layout.
5. `features/<tên>.md`: chi tiết từng feature (file, export, điểm mở rộng).

## Quy tắc cập nhật

- Thêm/xoá/đổi tên file, export public, route, store field → cập nhật file index liên quan trong cùng thay đổi.
- Thêm feature mới → tạo `features/<tên>.md` theo mẫu các file hiện có + thêm dòng vào `overview.md` và `graph/modules.md`.
- Đổi ngưỡng / rule nghiệp vụ → cập nhật `features/analysis.md` (mục Rules).
- Không chép code vào index; chỉ ghi đường dẫn, trách nhiệm, quan hệ.

Cập nhật lần cuối: 2026-09-30.
