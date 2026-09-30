# crm-tool

SPA tĩnh phân tích SKU (Vue 3 + TypeScript + Vite + Tailwind v4 + Pinia + Chart.js), không có backend.
Deploy: push GitHub → Cloudflare Workers tự chạy `npm run build` và publish `dist/`.

## Quy trình bắt buộc cho mọi task có thay đổi project

Áp dụng skill `code-index` tại `.codex/skills/code-index/SKILL.md`.

Trước khi sửa code:

1. Đọc `.code_index/README.md`.
2. Đọc `.code_index/overview.md`.
3. Đọc file feature/graph/design liên quan đến phần sắp sửa.

Sau khi sửa code:

1. Rà soát các file, export public, route, store field và rule đã thay đổi.
2. Cập nhật các file tương ứng trong `.code_index/` cùng thay đổi.
3. Không chép code vào code index; chỉ ghi đường dẫn, trách nhiệm và quan hệ.

## Quy ước kiến trúc

- Tổ chức feature-first trong `src/features/<tên>/` với các thư mục `components`, `composables`, `lib`, `model`, `engine`, `store`; `index.ts` là public API.
- Luồng phụ thuộc: `pages` → `features` → `features/analysis` → `shared`. `shared` không import `features`.
- Engine nghiệp vụ trong `features/analysis/engine` là TypeScript thuần, không import Vue/DOM; test Vitest đặt cạnh file.
- Ngưỡng nghiệp vụ chỉ nằm ở `features/analysis/model/thresholds.ts`.
- Màu chart chỉ nằm ở `shared/charts/palette.ts`.

## UI và hiệu năng

- Style bằng Tailwind utility và token màu (`bg-surface`, `text-ink`, `border-line`...) theo `.code_index/design.md`.
- Token tự đổi theo dark mode, không viết `dark:`. Màu vàng `tag` chỉ dùng cho điểm nhấn.
- Chart dùng `ChartCanvas` và config `computed` theo `usePalette()`; không gọi `new Chart` trực tiếp trong component.
- Mảng dữ liệu lớn dùng `shallowRef`/`markRaw`, không deep reactive. Bảng phải phân trang.
- Text UI bằng tiếng Việt, không dùng ký tự em dash.

## Kiểm tra trước khi push

- `npm run build` phục vụ deploy và không typecheck.
- Trước khi push chạy `npm run build:check` và `npm test`.
