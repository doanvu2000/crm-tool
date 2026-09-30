# shared

## charts
| File | Export / vai trò |
|---|---|
| `setup.ts` | `setupChartDefaults()` gọi ở `main.ts`: register plugin `valueLabels`, `guideLines`, font, tắt legend mặc định. Khai báo type plugin options qua module augmentation `chart.js` |
| `ChartCanvas.vue` | props `config`, `label`, `tall`. Lazy init theo viewport, cùng type + cùng indexAxis thì `chart.update()` tại chỗ, khác thì dựng lại, destroy khi unmount |
| `CountBarChart.vue` | Card + bar đếm SKU. props `title`, `subtitle`, `labels`, `data`, `colorKey`, `horizontal`, `tall`, `pickable`, `active`; emit `pick(label)`; slot `info`. Pickable có hàng nút ẩn (hiện khi focus bàn phím). Màn < 640px tự chuyển bar ngang (tránh nhãn xoay chéo) |
| `options.ts` | `animation()`, `tooltipStyle(p)`, `valueAxis(p)` (tick format vi-VN), `categoryAxis(p)`, `countBarConfig(p, labels, data, colors, horizontal, active, onPick)` (cột không chọn mờ alpha 40) |
| `palette.ts` | `PALETTE.light/dark`, type `ChartPalette`, gồm bảng màu chuỗi `series` cho nhiều cửa hàng trên biểu đồ lịch sử |

Plugin đọc màu từ `options.plugins.<id>` nên đổi theme chỉ cần update, không cần tạo lại chart.

## composables
- `useActiveSection(idsRef)` → id section đang đọc (IntersectionObserver).
- `useTheme()` → `{ theme, isDark, toggleTheme }` (state dùng chung toàn app).
- `usePalette()` → `ComputedRef<ChartPalette>`.
- `useDebouncedRef(initial, delay)`.
- `useMediaQuery(query)`, `useIsNarrow()` (< 640px).

## lib
- `format.ts`: `fmt0`, `fmt1`, `pct`, `money` (vi-VN, "tỷ"/"tr"), `signedPct`, `signedMoney`, `signedFmt0` (dấu + / −).
- `parse.ts`: `normalizeKey`, `parseNum` (1.234,5 và 1,234.5), `parseBool`.
- `download.ts`: `toCsv`, `downloadCsv` (BOM), type `CsvRow`.
- `scroll.ts`: `scrollToSection(id, { updateHash })` (reduced motion → cuộn tức thì, ghi hash cho deep link). Mọi chỗ cuộn tới section dùng hàm này.

## ui
`BaseCard` (eyebrow, title, subtitle, tag, slot `info` góc phải), `InfoPopover` (title, label, iconOnly; panel Teleport fixed, Esc / bấm ngoài đóng), `SectionHeader` (có default slot bên phải hint), `SectionNav` (items: id, label, meta; variant `bar` dùng cho mọi màn, `rail` còn giữ nhưng không dùng), `ScrollTopButton` (nút lên đầu trang, reduced motion cuộn tức thì), `SectionHeader`, `ChartLegend` (items), `InsightBox` (slot, `<b>` nhấn mạnh), `ColorDot`, `AppIcon` (name: chart, sun, moon, upload, download, arrow-right, empty, help, undo, close, edit, info, trash).
Class dùng chung trong `assets/styles/main.css`: `.card`, `.card-title`, `.card-sub`, `.eyebrow`, `.num`, `.btn`, `.btn-primary`, `.control`, `.field-label`, `.chip`, `.pill`, `.muted`, `.chart-box`, `.chart-box-tall`.
