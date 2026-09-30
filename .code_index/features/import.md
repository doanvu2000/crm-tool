# features/import

Đưa dữ liệu vào store. Public API: `ImportPanel`, `mapRows`, `parseLifecycle`, `ImportError`, `generateSampleData`, `COLUMNS`.

| File | Trách nhiệm |
|---|---|
| `components/ImportPanel.vue` | Dropzone (đếm dragenter/leave chống nháy), nút dữ liệu mẫu, tải file mẫu, status aria-live, thông báo dữ liệu được khôi phục, danh sách cột |
| `lib/columns.ts` | `COLUMNS` (key, label, required, aliases), `TEMPLATE_HEADER` có Ngành hàng, Subcat 1, Subcat 2 |
| `lib/mapRows.ts` | Map header → `SkuInput`, đọc subcategory tùy chọn và báo thiếu cột bắt buộc bằng `ImportError` |
| `lib/readSheet.ts` | `ACCEPTED_FILE`, `readSheet` (dynamic import `xlsx`) |
| `lib/sampleData.ts` | `generateSampleData(perCategory, seed)` PRNG mulberry32, 4 ngành với cây Subcat 1/2 mẫu |
| `lib/template.ts` | `downloadTemplate`, xuất CSV mẫu theo 3 cấp ngành hàng |

Cột bắt buộc: sku, revenue, units, unitsPrev, stock. `revenuePrev` (`revenue_prev`) tuỳ chọn: thiếu thì engine ước tính.
`ImportPanel`: nút `data-tour="sample"`, card `data-tour="import"`, có dữ liệu thì hiện nút "Xem và sửa dữ liệu" cuộn tới #input. Alias so khớp sau `normalizeKey` (bỏ dấu, lowercase).
Thêm cột: thêm entry vào `COLUMNS` + field trong `SkuInput` + map trong `mapRows`.
`category`, `subcat1`, `subcat2` là các cấp phân loại; hai cột Subcat tùy chọn để file cũ vẫn nhập được.
