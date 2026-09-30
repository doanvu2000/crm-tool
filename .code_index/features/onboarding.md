# features/onboarding

Tour highlight cho người dùng lần đầu. Public API: `TourOverlay`, `useTour`.

| File | Trách nhiệm |
|---|---|
| `lib/steps.ts` | `TOUR_STEPS` theo phase `intro` (import, settings, sample có CTA) và `data` (decision, category, compare, input, nav, help) |
| `composables/useTour.ts` | State module-level: phase, steps (chỉ giữ step có target đang hiện), index, `seen` lưu localStorage `sku-tour`. `start`, `next`, `prev`, `finish` (đánh dấu phase đã xem), `skipAll`, `restart` (chọn phase theo `hasData`), `findTarget` |
| `components/TourOverlay.vue` | Teleport body: khung highlight + popover, đo lại theo scroll/resize (rAF), tự start intro khi chưa có dữ liệu, tự start data khi có dữ liệu lần đầu. CTA bấm hộ target (vd "Dùng dữ liệu mẫu") |

Neo target: attribute `data-tour="<tên>"` (page: nav, decision, category, compare; ImportPanel: import, sample; SettingsPanel: settings; InputEditorSection: input; AppHeader: help).
Thêm step: thêm entry vào `TOUR_STEPS` + gắn `data-tour` vào phần tử.
