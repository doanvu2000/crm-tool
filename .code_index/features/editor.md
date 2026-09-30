# features/editor

Xem và sửa dữ liệu đầu vào sau khi import, kết quả tính lại ngay. Public API: `InputEditorSection`, `exportInputCsv`.

| File | Trách nhiệm |
|---|---|
| `components/InputEditorSection.vue` | Section #input: dải tác động (số SKU theo nhóm Action trước → sau sửa, `data-tour="input"`), tìm kiếm, chip "Chỉ SKU đã sửa", "Khôi phục file gốc" (confirm), "Tải CSV đã sửa", bảng 14 cột sửa được (gồm Ngành hàng/Subcat 1/2) + cột Kết quả, phân trang 25 |
| `components/EditSkuDialog.vue` | `<dialog>` xem + sửa toàn bộ trường 1 SKU theo nhóm (Thông tin / Kỳ này / Kỳ trước), "Gốc: ..." dưới ô đã sửa, cột Kết quả live (Action, ABC, ADS, DOS, OOS, Growth, Doanh thu), nút Xem từng bước tính (SkuTrace), SKU trước/sau theo danh sách đang lọc, Xoá/Khôi phục SKU, Về số gốc |
| `components/CellInput.vue` | Ô sửa (prop `field` = kiểu ô form trong dialog, `inputId` cho label): draft chuỗi, commit sau 300ms / blur / Enter (Enter xuống dòng dưới qua `data-cell="pos:col"`), Esc huỷ. Không focus thì hiện số đã format |
| `composables/useInputEditor.ts` | `useInputEditor()` (+ `rowAt(index)`, `EditorRow.removed`) lọc theo index trong `raw`, map kết quả theo sku (`rows`, `baselineRows`), `EDITOR_PAGE_SIZE` |
| `lib/editColumns.ts` | `EDIT_COLUMNS` (key, label, kind text/number/lifecycle/bool), `EDIT_GROUPS`, `parseEdit(col, value)` (số âm → 0, ngành trống → Khác) |
| `lib/exportInput.ts` | `exportInputCsv(activeRaw)` (bỏ SKU đã xoá), xuất đủ category/subcat1/subcat2, `revenue_prev`, `days` |

SKU không sửa được (là khoá map kết quả). Cột SKU sticky có icon sửa (mở dialog) + xoá. Xoá = đánh dấu `store.removed`, dòng gạch ngang + nút khôi phục; SKU đã xoá tính là đã sửa.
