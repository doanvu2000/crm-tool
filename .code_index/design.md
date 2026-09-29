# Design system

Ý tưởng: công cụ ra quyết định PO trong kho hàng. Nền kệ thép, mặt phiếu, mực PO, vạch kệ, nhãn giá vàng.

## Token (Tailwind v4, `src/assets/styles/main.css`)

Khai báo trong `@theme`, dark mode ghi đè biến ở `:root.dark`, nên component KHÔNG cần `dark:`.

| Utility | Light | Dark | Dùng cho |
|---|---|---|---|
| `bg-canvas` | #edf0f3 | #0b1117 | nền trang |
| `bg-surface` | #ffffff | #121a23 | card |
| `bg-sunken` | #f4f6f8 | #18222d | ô nhập, ô phụ, hover dòng |
| `border-line` | #d9dfe5 | #243140 | viền, vạch |
| `text-ink` | #111b24 | #e8edf2 | chữ chính, nút primary |
| `text-ink-2` | #4a5866 | #a9b6c3 | chữ phụ |
| `text-ink-3` | #5f6c78 | #8b99a7 | nhãn, chú thích |
| `bg-tag` / `text-tag-ink` | #f6c522 / #1a1400 | #ffd23a | CHỈ 3 chỗ: logo, dải thẻ quyết định, mục lục đang chọn (+ pill Core, viền ô Core) |
| `outline-focus` | #1d4ed8 | #93c5fd | focus ring |

Màu chart riêng ở `shared/charts/palette.ts` (neutrals khớp token trên).

## Chữ

- `font-sans` Google Sans: giao diện, tiêu đề (600, tracking âm).
- `font-mono` Google Sans Code: mã SKU, số liệu, `.eyebrow`, `.num`.

## Quality floor (ui-ux-pro-max)

- Vùng chạm ≥ 44px trên mobile (`.btn`, `.chip`, `.control`, nút hero, mục lục); desktop được gọn hơn qua `sm:`.
- `.control` 16px trên mobile để iOS không tự zoom.
- Chữ nhỏ nhất 12px (`text-xs`), trừ mũi tên sort.
- Focus ring `outline-focus` ở mọi control; dropzone đẩy ring lên label bằng `has-[input:focus-visible]`.
- Heading: h1 sr-only ở page → h2 section → h3 card.
- Lỗi import: `role=alert`, lỗi thiếu cột tự mở danh sách cột.
- Reduced motion: CSS tắt animation, Chart.js tắt animation, cuộn tức thì.

## Điểm nhấn

`features/overview/components/DecisionHero.vue`: thẻ nhãn kệ (dải vàng + lỗ đục), câu kết luận, dải stacked 5 nhóm Action
(animation `strip-grow` duy nhất của trang), nút nhóm bấm để lọc bảng SKU (`store.actionFilter`).

## Layout

Desktop ≥ lg: cột trái 184px `SectionNav` rail sticky. Mobile: 1 cột + `SectionNav` bar sticky dưới header (top-16), section dùng `scroll-mt-36 lg:scroll-mt-24`.
Thứ tự: Dữ liệu (#data) → Quyết định (#dashboard) → Tổng quan → Đóng góp → Tồn kho → Chi tiết Action → Quy tắc.
Section cần `id` + `scroll-mt-24` để mục lục và header sticky khớp.
