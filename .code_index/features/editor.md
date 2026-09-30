# features/editor

Xem và sửa dữ liệu đầu vào sau khi import, kết quả tính lại ngay. Public API: `InputEditorSection`, `exportInputCsv`.

| File | Trách nhiệm |
|---|---|
| `components/InputEditorSection.vue` | Section #input: dải tác động (số SKU theo nhóm Action trước → sau sửa, `data-tour="input"`), tìm kiếm, chip "Chỉ SKU đã sửa", "Khôi phục file gốc" (confirm), "Tải CSV đã sửa", bảng 12 cột sửa được + cột Kết quả (Action, ABC, DOS, "Trước khi sửa"), phân trang 25 |
| `components/CellInput.vue` | Ô sửa: draft chuỗi, commit sau 300ms / blur / Enter (Enter xuống dòng dưới qua `data-cell="pos:col"`), Esc huỷ. Không focus thì hiện số đã format |
| `composables/useInputEditor.ts` | `useInputEditor()` lọc theo index trong `raw`, map kết quả theo sku (`rows`, `baselineRows`), `EDITOR_PAGE_SIZE` |
| `lib/editColumns.ts` | `EDIT_COLUMNS` (key, label, kind text/number/lifecycle/bool) |
| `lib/exportInput.ts` | `exportInputCsv(raw)` theo header file mẫu (có `revenue_prev`, `days`) |

SKU không sửa được (là khoá map kết quả). Số âm kẹp về 0. Ngành để trống thành "Khác".
