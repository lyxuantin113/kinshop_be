# Tóm tắt cấu trúc thư mục dự án `kinshop_be`

Dự án là một hệ thống Backend được xây dựng bằng **Express.js** và **TypeScript**, sử dụng **Prisma ORM** để quản lý cơ sở dữ liệu. Cấu trúc dự án được tổ chức theo kiến trúc modular (theo tính năng).

## 1. Cấu trúc thư mục gốc (Root)
- `prisma/`: Chứa schema định nghĩa cơ sở dữ liệu (`schema.prisma`) và các tệp migration.
- `src/`: Thư mục mã nguồn chính của ứng dụng.
- `Dockerfile` & `docker-compose.yml`: Cấu hình Docker để đóng gói và triển khai ứng dụng.
- `GCP_GUIDE.md`: Tài liệu hướng dẫn triển khai và tích hợp với Google Cloud Platform.
- `.env`: Tệp cấu hình biến môi trường (Database URL, JWT Secret, Cloud Storage keys...).
- `package.json`: Danh sách các dependencies và scripts của dự án.
- `tsconfig.json`: Cấu hình trình biên dịch TypeScript.

## 2. Thư mục mã nguồn (`src/`)
Được chia thành các thành phần logic rõ ràng:

- **`modules/`**: Chứa các module tính năng chính của hệ thống. Mỗi module thường bao gồm `controller`, `service`, `dto`, và `interface`.
  - `user/`: Quản lý người dùng và xác thực.
  - `product/`: Quản lý sản phẩm.
  - `category/`: Quản lý danh mục sản phẩm.
  - `order/`: Xử lý đơn hàng.
  - `cart/`: Quản lý giỏ hàng.
  - `discount/`: Quản lý mã giảm giá/khuyến mãi.
  - `system-config/`: Cấu hình hệ thống.
- **`config/`**: Chứa các tệp cấu hình ứng dụng (cổng, kết nối database, redis...).
- **`core/`**: Chứa các logic cốt lõi, middlewares dùng chung (auth, error handler, rate limit...).
- **`common/`**: Các tiện ích (`utils`), hằng số (`constants`) và types dùng chung toàn dự án.
- **`docs/`**: Chứa cấu hình Swagger để tự động tạo tài liệu API.
- **`tests/`**: Các kịch bản kiểm thử (Unit tests, Integration tests) sử dụng Jest.
- **`main.ts` & `app.ts`**: Tệp khởi tạo server và cấu hình ứng dụng Express.
- **`seed.ts`**: Script dùng để khởi tạo dữ liệu mẫu cho database.

## 3. Công nghệ sử dụng (Tech Stack)
- **Framework**: Express.js (v5.x)
- **ORM**: Prisma (v7.x) - Database PostgreSQL.
- **Validation**: Zod (định nghĩa schema và validate dữ liệu đầu vào).
- **Authentication**: JWT & Bcrypt.
- **Cloud**: Google Cloud Storage (lưu trữ file).
- **Logging**: Pino (log hệ thống tốc độ cao).
- **Testing**: Jest & Supertest.
