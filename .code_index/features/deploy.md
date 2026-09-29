# Deploy

- Không có server. Push lên GitHub nhánh production → Cloudflare Workers Builds tự build và deploy.
- Cloudflare build: `npm run build` (chỉ `vite build`), deploy: `npx wrangler deploy`.
- `wrangler.jsonc`: static assets từ `./dist`, `not_found_handling: single-page-application` (SPA fallback cho Vue Router history mode).
- `public/_headers`: cache immutable cho `/assets/*` (file có hash), header bảo mật cơ bản.
- `.node-version`: Node 22 cho máy build Cloudflare.
- Commit `package-lock.json` để build trên Cloudflare dùng đúng version.
- Vì push = deploy production: chạy `npm run build:check` và `npm test` trước khi push.
