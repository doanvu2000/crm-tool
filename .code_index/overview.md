# Overview

SPA tĩnh phân tích SKU (ABC, ADS, DOS, OOS, Growth, Core SKU, Action) từ file CSV/Excel.
Toàn bộ xử lý chạy trên trình duyệt, không có backend. Nghiệp vụ gốc: `Nguyên tắc xây  dựng Analysis.md`.

## Stack

| Mảng | Công nghệ |
|---|---|
| UI | Vue 3.5 (`<script setup>` + TS), Vue Router 4 (lazy route) |
| State | Pinia 3 (setup store) |
| Style | Tailwind CSS v4 (`@tailwindcss/vite`), token màu trong `@theme`, dark mode = class `.dark` đổi biến (xem `design.md`) |
| Chart | Chart.js 4 (`chart.js/auto`) + wrapper `ChartCanvas.vue` |
| Đọc file | SheetJS `xlsx` 0.20.3, dynamic import khi mở file |
| Build | Vite 7, target es2022 |
| Test | Vitest (engine thuần) |
| Deploy | GitHub push → Cloudflare Workers static assets (`wrangler.jsonc`) |

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | `vite build` (không typecheck, để deploy nhanh và không vỡ vì lỗi type) |
| `npm run typecheck` | `vue-tsc -b` |
| `npm run build:check` | typecheck + build |
| `npm test` | Vitest |

## Cây thư mục

```
src/
├── main.ts                 bootstrap: Pinia, Router, Chart defaults, CSS
├── App.vue                 skip link + AppHeader + RouterView
├── app/                    khung app: router.ts, layout/AppHeader.vue
├── pages/                  1 file / route, chỉ ghép feature
│   └── SkuAnalysisPage.vue
├── features/               feature-first, mỗi feature có index.ts (public API)
│   ├── analysis/           DOMAIN: types, thresholds, engine thuần, Pinia store
│   ├── import/             đọc file, map cột ngành hàng/Subcat 1/2, dữ liệu mẫu, file mẫu CSV
│   ├── settings/           chuẩn ABC CVS (Sales, rolling 8 tuần, 70/90 theo ngành) + basis bổ sung cho business rule
│   ├── overview/           lọc phân cấp ngành hàng → Subcat 1/2 + KPI tiles + so với kỳ trước
│   ├── contribution/       Pareto, cơ cấu ABC, ma trận ABC x Velocity, Exception
│   ├── inventory/          phân bố Velocity/DOS/OOS/Trend + scatter DOS x Growth
│   ├── monthly-sales/      nhập dữ liệu lịch sử theo tháng + biểu đồ doanh thu theo cửa hàng
│   ├── actions/            phân bổ Action + bảng SKU (lọc/sort/trang/xuất CSV)
│   ├── editor/             bảng sửa dữ liệu đầu vào realtime + dải tác động Action
│   ├── onboarding/         tour highlight hướng dẫn lần đầu (2 phase: intro, data)
│   └── rules/              panel mô tả quy tắc đang áp dụng
├── shared/                 không biết gì về nghiệp vụ SKU
│   ├── charts/             ChartCanvas, CountBarChart, palette, options, plugins
│   ├── composables/        useTheme, usePalette, useDebouncedRef
│   ├── lib/                format, parse, download
│   └── ui/                 BaseCard, SectionHeader, ChartLegend, InsightBox, ColorDot, AppIcon
└── assets/styles/main.css  Tailwind + @theme font + component classes (.card, .btn, .chip...)
```

## Quy tắc tầng

- `pages` → `features/*` → `features/analysis` → `shared`. Không đi ngược.
- Feature UI chỉ import feature khác qua `index.ts`; chỉ `analysis` được dùng chung bởi mọi feature.
- `features/analysis/engine` là TS thuần: không import Vue, Pinia, DOM. Test được bằng Vitest node.
- Ngưỡng nghiệp vụ chỉ nằm ở `features/analysis/model/thresholds.ts`.
- Màu chart chỉ nằm ở `shared/charts/palette.ts` (hex theo Tailwind), UI đọc qua `usePalette()`.
- Text UI tiếng Việt, không dùng ký tự em dash.

## Hiệu năng (bắt buộc giữ)

- Store dùng `shallowRef` + `markRaw` cho mảng SKU: không deep reactive.
- `ChartCanvas` khởi tạo chart khi vào viewport (IntersectionObserver) và cập nhật tại chỗ khi config đổi.
- Bảng SKU phân trang 25 dòng, ô tìm kiếm debounce 200ms.
- `xlsx` lazy load; `vue`/`chart.js` tách chunk riêng (`vite.config.ts`).
- Chart và khung có chiều cao cố định (`.chart-box`, `.chart-box-tall`) để không nhảy layout.
