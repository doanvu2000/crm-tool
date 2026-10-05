# crm-tool

SPA tĩnh phân tích SKU (Vue 3 + TypeScript + Vite + Tailwind v4 + Pinia + Chart.js), không có backend.
Deploy: push GitHub → Cloudflare Workers tự chạy `npm run build` và publish `dist/`.

## Quy trình bắt buộc cho mọi task có thay đổi project

Áp dụng skill `code-index` tại `.codex/skills/code-index/SKILL.md`.

Skill UI project-local đã cài tại `.agents/skills/ui-ux/SKILL.md`; dùng skill này cho các task dựng, sửa, review hoặc refactor giao diện app. Skill phải giữ component library, brand color và layout hiện tại, trừ khi người dùng yêu cầu đổi style.

Trước khi sửa code:

1. Đọc `.code_index/README.md`.
2. Đọc `.code_index/overview.md`.
3. Đọc file feature/graph/design liên quan đến phần sắp sửa.
4. Nếu thay đổi UI, đọc `.code_index/design.md` trước và áp dụng `.agents/skills/ui-ux/SKILL.md`. Nếu project/chức năng chưa có style được định nghĩa, bắt buộc dùng cả `/frontend-design:frontend-design` và `/ui-ux-pro-max:ui-ux-pro-max`; nếu skill chưa khả dụng trong môi trường, phải báo rõ và dùng style hiện có làm fallback.

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
- Mọi thay đổi UI phải tuân thủ đúng style hiện tại của web: kế thừa token màu, typography, spacing, layout, dark mode, component pattern và interaction pattern đã có; không tự ý tạo design system hoặc phong cách mới.
- Với thay đổi UI, ưu tiên chỉnh sửa component/token hiện có trước khi thêm pattern mới; kiểm tra responsive, accessibility, focus/keyboard và trạng thái loading/error.
- Nếu chưa có style cụ thể, dùng Tailwind CSS utility và token thay vì CSS rời rạc; font mặc định là Google Sans (và Google Sans Code cho mã/số liệu khi phù hợp).
- UI phải hỗ trợ dark/light mode và có nút chuyển theme ở header; dùng cơ chế theme/token hiện có, không tạo state hoặc token trùng lặp.
- Layout phải responsive, chia nội dung thành các block/section rõ ràng; nội dung clean, đơn giản, dễ đọc, không thêm chi tiết trang trí không cần thiết.
- Không tạo scroll ngang hoặc tràn width nếu không có yêu cầu nghiệp vụ; bảng/dữ liệu nhiều cột phải xử lý theo pattern hiện có.
- Nếu có nhiều mục/section, phải có menu điều hướng; ưu tiên menu ngang phía trên và giữ menu ghim khi scroll để người dùng luôn truy cập được.

## Kiểm tra trước khi push

- `npm run build` phục vụ deploy và không typecheck.
- Trước khi push chạy `npm run build:check` và `npm test`.
