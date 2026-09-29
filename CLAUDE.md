# crm-tool

SPA tĩnh phân tích SKU (Vue 3 + TS + Vite + Tailwind v4 + Pinia + Chart.js). Không backend.
Deploy: push GitHub → Cloudflare Workers tự build (`npm run build`) và publish `dist/`.

## Bắt buộc mỗi task

1. TRƯỚC khi code: đọc `.code_index/README.md` → `overview.md` → file feature liên quan.
2. SAU khi code: cập nhật `.code_index/` cho mọi file/export/route/store/rule đã đổi.

## Quy ước

- Feature-first trong `src/features/<tên>/` (components, composables, lib, model, engine, store) + `index.ts` là public API.
- Tầng: `pages` → `features` → `features/analysis` → `shared`. `shared` không import `features`.
- Engine nghiệp vụ (`features/analysis/engine`) là TS thuần, không Vue/DOM, có test Vitest cạnh file.
- Ngưỡng nghiệp vụ chỉ ở `features/analysis/model/thresholds.ts`; màu chart chỉ ở `shared/charts/palette.ts`.
- Style bằng Tailwind utility + token màu (`bg-surface`, `text-ink`, `border-line`...) xem `.code_index/design.md`; token tự đổi theo dark mode, không viết `dark:`. Màu vàng `tag` chỉ dùng cho điểm nhấn.
- Chart: `ChartCanvas` + config `computed` theo `usePalette()`; không tự `new Chart` trong component.
- Mảng dữ liệu lớn: `shallowRef`/`markRaw`, không deep reactive. Bảng phải phân trang.
- Text UI tiếng Việt, không dùng ký tự em dash.
- `npm run build` không typecheck để deploy không vỡ; trước khi push chạy `npm run build:check` + `npm test`.
