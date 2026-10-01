# Deploy

- Không có server. Push lên GitHub nhánh production → Cloudflare Workers Builds tự build và deploy.
- Cloudflare build: `npm run build` (chỉ `vite build`), deploy: `npx wrangler deploy`.
- `wrangler.jsonc`: static assets từ `./dist`, `not_found_handling: single-page-application` (SPA fallback cho Vue Router history mode).
- Vite build đồng thời `index.html` hiện tại và `pilot.html` độc lập; website cũ ở `/`, dashboard thử nghiệm ở `/pilot.html` trên cùng static assets. Không đổi `index.html` hoặc route web cũ.
- `public/_headers`: cache immutable cho `/assets/*` (file có hash), header bảo mật cơ bản.
- `.node-version`: Node 22 cho máy build Cloudflare.
- Commit `package-lock.json` để build trên Cloudflare dùng đúng version.
- Vì push = deploy production: chạy `npm run build:check` và `npm test` trước khi push.
