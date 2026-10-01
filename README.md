# Góc Truyện

Ứng dụng đọc, nghe và quản lý truyện bằng Next.js 16, React 19, TypeScript và MongoDB.

## Chạy cục bộ

Cần Node.js 20.9+ và MongoDB. Tạo `.env` với `MONGODB_URI` và `JWT_SECRET`. Để dùng Cloudflare R2 cần thêm `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`. Nếu dùng UploadThing, đặt `UPLOADTHING_TOKEN`. `NEXT_PUBLIC_SITE_URL` là URL của website.

```bash
npm ci
npm run dev
```

Chạy `npx tsc --noEmit`, `node --test tests/*.test.cjs`, `npm run lint`, `npm run build` để kiểm tra. Trang chủ cần MongoDB để hiển thị dữ liệu. Khi thiếu kết nối, trang chủ hiển thị trạng thái rỗng; các API phụ thuộc DB trả lỗi sớm.

## Đăng chương hẹn giờ

Chương có `status: scheduled` và `scheduledAt` trong tương lai. Độc giả thấy chương sau thời điểm này dù job chưa chạy; job đổi trạng thái bền vững thành `published`. Cấu hình một scheduler của môi trường triển khai chạy **mỗi phút** bằng một trong hai cách:

- Chạy `npm run publish:scheduled` trong môi trường có quyền truy cập MongoDB.
- Gửi `POST /api/jobs/publish` với header `Authorization: Bearer <CRON_SECRET>`. Đặt `CRON_SECRET` trong môi trường của ứng dụng.

`npm run migrate:slugs` backfill slug cũ theo lô khi cần; migration này không chạy trong request và cần được khởi chạy thủ công một lần.

## Triển khai trên Dokploy

Chọn **Build Type: Dockerfile**, **Dockerfile Path: `Dockerfile`**, **Docker Context Path: `.`** và cổng ứng dụng **3000**. Dockerfile cài dependency từ `package-lock.json` bằng Node 20 rồi build Next.js. Nếu vẫn chọn Nixpacks, Dokploy sẽ chạy bước tải Nix trước khi dùng tới mã nguồn; lỗi `Canceled: context canceled` ở bước này là lỗi môi trường build, không phải lỗi biên dịch Next.js.

Lượt đọc được ghi qua `POST /api/track/read`, tối đa một lần cho mỗi chương, mỗi độc giả, mỗi ngày theo giờ Việt Nam. Bản ghi dùng để vẽ thống kê tác giả trong 90 ngày gần nhất. Dữ liệu lượt xem cũ vẫn nằm ở bộ đếm `views`, nhưng biểu đồ chỉ có dữ liệu kể từ khi triển khai cơ chế ghi nhận mới.
