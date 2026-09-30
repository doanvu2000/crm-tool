# Design system

Ý tưởng: công cụ ra quyết định PO trong kho hàng. Nền sáng gần trắng, mặt phiếu, mực PO, vạch kệ, nhãn kệ màu teal (đổi từ vàng 2026-09-30).
Màu nhấn teal và màu `edit` hồng phải khác 5 màu nhóm Action trong chart. Chữ trên nền teal dùng `tag-ink` đậm (chữ trắng không đủ tương phản).

## Token (Tailwind v4, `src/assets/styles/main.css`)

Khai báo trong `@theme`, dark mode ghi đè biến ở `:root.dark`, nên component KHÔNG cần `dark:`.

| Utility | Light | Dark | Dùng cho |
|---|---|---|---|
| `bg-canvas` | #f7f9fc | #0b1117 | nền trang |
| `bg-surface` | #ffffff | #121a23 | card |
| `bg-sunken` | #f0f4f8 | #18222d | ô nhập, ô phụ, hover dòng |
| `border-line` | #dfe5ec | #243140 | viền, vạch |
| `text-ink` | #0f1b2a | #e8edf2 | chữ chính, nút primary |
| `text-ink-2` | #4a5866 | #a9b6c3 | chữ phụ |
| `text-ink-3` | #5f6c78 | #8b99a7 | nhãn, chú thích |
| `bg-tag` / `text-tag-ink` (màu nhấn teal) | #14b8a6 / #042f2e | #2dd4bf / #042f2e | CHỈ các chỗ: logo, dải thẻ quyết định, mục lục đang chọn, khung + nhãn tour hướng dẫn (+ pill Core, viền ô Core) |
| `outline-focus` | #1d4ed8 | #93c5fd | focus ring |
| `edit` (`border-edit`, `bg-edit/5`, `text-edit`) | #db2777 | #f472b6 | ô / dòng đã sửa trong bảng dữ liệu đầu vào, số đã sửa |

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

`features/overview/components/DecisionHero.vue`: thẻ nhãn kệ (dải teal + lỗ đục), câu kết luận, dải stacked 5 nhóm Action
(animation `strip-grow` duy nhất của trang), nút nhóm bấm để lọc bảng SKU (`store.actionFilter`).

## Tour hướng dẫn

`features/onboarding/components/TourOverlay.vue`: scrim box-shadow quanh vùng highlight (pointer-events none, trang vẫn bấm được), khung viền teal + nhãn kệ `i / n`, popover có dải teal + lỗ đục như thẻ quyết định. Mobile: popover dock trên hoặc dưới tuỳ vị trí target. Esc đóng, ← → chuyển.

## Layout

Desktop ≥ lg: cột trái 184px `SectionNav` rail sticky. Mobile: 1 cột + `SectionNav` bar sticky dưới header (top-16), section dùng `scroll-mt-36 lg:scroll-mt-24`.
Thứ tự: Dữ liệu (#data) → Quyết định (#dashboard) → Tổng quan (KPI + #compare) → Đóng góp → Tồn kho → Chi tiết Action → Dữ liệu đầu vào (#input) → Quy tắc.
`[data-tour]` có `scroll-margin-top: 7rem`.
Section cần `id` + `scroll-mt-24` để mục lục và header sticky khớp.
