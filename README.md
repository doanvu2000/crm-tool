# SKU Analysis

Web phân tích SKU theo ABC, tốc độ bán (ADS), tồn kho (DOS), OOS, xu hướng và đề xuất Action.
Chạy hoàn toàn trên trình duyệt: file dữ liệu không rời máy người dùng.

## Chạy local

```bash
npm install
npm run dev
```

## Trước khi push (push = deploy production)

```bash
npm run build:check
npm test
```

## Deploy Cloudflare (thiết lập 1 lần)

Cloudflare Dashboard → Workers & Pages → Create → Import a repository → chọn repo này.

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Cấu hình đọc từ `wrangler.jsonc` (static assets `dist/`, SPA fallback).

Sau đó mỗi lần push lên nhánh production là tự deploy.

## Tài liệu

- Nghiệp vụ: `Nguyên tắc xây  dựng Analysis.md`
- Kiến trúc: `.code_index/`
