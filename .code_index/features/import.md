# features/import

Đưa dữ liệu vào store. Public API: `ImportPanel`, `mapRows`, `parseLifecycle`, `ImportError`, `generateSampleData`, `COLUMNS`.

| File | Trách nhiệm |
|---|---|
| `components/ImportPanel.vue` | Dropzone (đếm dragenter/leave chống nháy), nút dữ liệu mẫu, tải file mẫu, status aria-live, danh sách cột |
| `lib/columns.ts` | `COLUMNS` (key, label, required, aliases), `TEMPLATE_HEADER` |
| `lib/mapRows.ts` | Map header → `SkuInput`, báo thiếu cột bắt buộc bằng `ImportError` |
| `lib/readSheet.ts` | `ACCEPTED_FILE`, `readSheet` (dynamic import `xlsx`) |
| `lib/sampleData.ts` | `generateSampleData(perCategory, seed)` PRNG mulberry32, 4 ngành |
| `lib/template.ts` | `downloadTemplate` |

Cột bắt buộc: sku, revenue, units, unitsPrev, stock. Alias so khớp sau `normalizeKey` (bỏ dấu, lowercase).
Thêm cột: thêm entry vào `COLUMNS` + field trong `SkuInput` + map trong `mapRows`.
