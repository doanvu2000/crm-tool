# PLAN: SKU Analysis web

Ngày: 2026-09-30

## Mục tiêu
Web tĩnh nhận CSV/Excel SKU, áp "Nguyên tắc xây dựng Analysis", xuất biểu đồ + Action có truy vết.
Ưu tiên: mượt, không lỗi giao diện, build nhanh, scale lâu dài, dev 1 người.

## Quyết định
- Stack: Vue 3 + TS + Vite 7 + Tailwind v4 + Pinia + Vue Router + Chart.js + SheetJS (lazy).
- Không backend; deploy Cloudflare Workers static assets qua GitHub push.
- Feature-first + `.code_index/` + `CLAUDE.md`.
- Build = `vite build` (không typecheck); typecheck/test chạy riêng trước khi push.

## Đã làm (v0.1)
- [x] Engine: metrics, ABC, classify, Core, Action rule engine có reasons, test Vitest.
- [x] Import CSV/XLSX, alias cột VN/EN, dữ liệu mẫu, file mẫu CSV.
- [x] Dashboard: KPI, Pareto, ABC mix, ma trận ABC x Velocity, Exception, 4 phân bố, scatter DOS x Growth, Action, bảng SKU, xuất CSV, panel rule.
- [x] Dark/light toggle, Google Sans, responsive, lazy chart, update chart tại chỗ.
- [x] Cấu hình deploy Cloudflare.

## Việc tiếp theo (đề xuất)
- [ ] Ngưỡng theo ngành hàng (UI chỉnh threshold, lưu localStorage / file JSON).
- [ ] Đưa Lead Time, order cycle vào DOS target.
- [ ] Tiêu chí nhận diện Seasonal tự động (so cùng kỳ năm trước).
- [ ] Web Worker cho `analyzeSkus` khi > 20k SKU.
- [ ] CI GitHub Actions: typecheck + test chặn trước khi Cloudflare build.
- [ ] Cân nhắc shadcn-vue (Reka UI) khi cần dialog, combobox, tooltip phức tạp.
