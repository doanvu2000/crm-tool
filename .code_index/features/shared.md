# shared

## charts
| File | Export / vai trò |
|---|---|
| `setup.ts` | `setupChartDefaults()` gọi ở `main.ts`: register plugin `valueLabels`, `guideLines`, font, tắt legend mặc định. Khai báo type plugin options qua module augmentation `chart.js` |
| `ChartCanvas.vue` | props `config`, `label`, `tall`. Lazy init theo viewport, cùng type + cùng indexAxis thì `chart.update()` tại chỗ, khác thì dựng lại, destroy khi unmount |
| `CountBarChart.vue` | Card + bar đếm SKU. props `title`, `subtitle`, `labels`, `data`, `colorKey`, `horizontal`, `tall`. Màn < 640px tự chuyển bar ngang (tránh nhãn xoay chéo) |
| `options.ts` | `animation()`, `tooltipStyle(p)`, `valueAxis(p)`, `categoryAxis(p)`, `countBarConfig(...)` |
| `palette.ts` | `PALETTE.light/dark`, type `ChartPalette` |

Plugin đọc màu từ `options.plugins.<id>` nên đổi theme chỉ cần update, không cần tạo lại chart.

## composables
- `useActiveSection(idsRef)` → id section đang đọc (IntersectionObserver).
- `useTheme()` → `{ theme, isDark, toggleTheme }` (state dùng chung toàn app).
- `usePalette()` → `ComputedRef<ChartPalette>`.
- `useDebouncedRef(initial, delay)`.
- `useMediaQuery(query)`, `useIsNarrow()` (< 640px).

## lib
- `format.ts`: `fmt0`, `fmt1`, `pct`, `money` (vi-VN, "tỷ"/"tr").
- `parse.ts`: `normalizeKey`, `parseNum` (1.234,5 và 1,234.5), `parseBool`.
- `download.ts`: `toCsv`, `downloadCsv` (BOM), type `CsvRow`.
- `scroll.ts`: `scrollToSection(id, { updateHash })` (reduced motion → cuộn tức thì, ghi hash cho deep link). Mọi chỗ cuộn tới section dùng hàm này.

## ui
`BaseCard` (eyebrow, title, subtitle, tag), `SectionNav` (items: id, label, meta; variant `rail` dọc desktop | `bar` ngang mobile), `SectionHeader`, `ChartLegend` (items), `InsightBox` (slot, `<b>` nhấn mạnh), `ColorDot`, `AppIcon` (name: chart, sun, moon, upload, download, arrow-right, empty).
Class dùng chung trong `assets/styles/main.css`: `.card`, `.card-title`, `.card-sub`, `.eyebrow`, `.num`, `.btn`, `.btn-primary`, `.control`, `.field-label`, `.chip`, `.pill`, `.muted`, `.chart-box`, `.chart-box-tall`.
