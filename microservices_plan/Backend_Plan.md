# KIẾN TRÚC TỔNG THỂ (Target Architecture)
- Chúng ta sẽ chuyển từ Modular Monolith sang Event-Driven Microservices.
- API Gateway: Kong (Sử dụng Plugin cho Auth và Rate Limiting).
- Service Communication: gRPC (Synchronous) và Kafka (Asynchronous).
- Data Strategy: Database-per-service (Mỗi service 1 DB PostgreSQL riêng biệt).
- Observability: Prometheus, Grafana, và Jaeger (Distributed Tracing).

# NHIỆM VỤ 1: LEAD BACKEND DEVELOPER (The Executor)
Mục tiêu: Xé nhỏ src/modules/ thành các Repository độc lập và thiết lập giao tiếp gRPC.

### Shared Library (kinshop-core):
- Chuyển đổi toàn bộ code tại src/core/ và src/common/ thành một thư viện độc lập mang tên @kinshop/shared. Các Service (Auth, Product, Order) sẽ cài đặt nó như một dependency từ private registry.
- Yêu cầu: Mọi Service phải cài đặt library này qua npm để đảm bảo tính nhất quán về AppError, Logger (Pino), và Validation (Zod).

1. Cấu trúc Repo @kinshop/shared:
- libs/errors: Chuyển lớp AppError và logic xử lý lỗi tập trung vào đây.
- libs/logger: Đóng gói Pino logger với cấu hình chuẩn (Structured logging).
- libs/middlewares: Trích xuất auth, validation (Zod), rate-limit.
- libs/dto: Định nghĩa các Zod Schema dùng chung (ví dụ: PaginationDTO, BaseResponse).

2. Yêu cầu kỹ thuật (Hard Constraints):
- Bundler: Sử dụng tsup để build thư viện ra cả hai định dạng ESM và CommonJS.
- Type Safety: Phải export toàn bộ TypeScript Types để các Service con không phải định nghĩa lại.
- Validation: Tích hợp chặt chẽ Zod. Middleware validate phải nhận vào một Zod Schema và trả về lỗi chuẩn 400.

### Database Split:
Mục tiêu: Phá bỏ sự phụ thuộc vào một Database PostgreSQL duy nhất. Chuyển sang mô hình Database-per-service.

1. Phân lập các vùng dữ liệu (Data Domains)
Dựa trên cấu trúc prisma/schema.prisma hiện tại, bạn phải chia tách thành 3 Database độc lập hoàn toàn:
- DB_IDENTITY: Chỉ chứa các bảng liên quan đến User, Account, Profile, Role.
- DB_CATALOG: Chỉ chứa Product, Category, Inventory_Stock.
- DB_ORDER: Chỉ chứa Order, Order_Item, Cart, Discount.

2. Quy tắc "Bàn tay sắt" (The Hard Rules)
Bạn phải tuân thủ tuyệt đối 2 quy tắc sau khi tách file schema.prisma:
- No Cross-DB Joins: Cấm tuyệt đối việc sử dụng @relation của Prisma giữa các bảng nằm ở 2 DB khác nhau.
    - Ví dụ: Trong DB_ORDER, bảng Order_Item không được có quan hệ trực tiếp (FK) với bảng Product của DB_CATALOG.

- Logical IDs Only: Bạn chỉ được phép lưu product_id (kiểu String/UUID) trong bảng Order_Item.
    - Khi cần lấy tên sản phẩm để hiển thị hóa đơn, Backend phải gọi một API (hoặc gRPC) sang Catalog Service để lấy thông tin dựa trên ID đó, thay vì dùng JOIN.

3. Các bước thực hiện chi tiết
- Khởi tạo 3 file Schema mới: * Tạo identity.prisma, catalog.prisma, order.prisma từ file schema.prisma gốc.

- Refactor Code Logic:
    - Tìm tất cả những chỗ dùng prisma.order.findMany({ include: { product: true } }).
    - Bạn phải xóa dòng include đó đi vì Prisma sẽ báo lỗi (do không còn relation).
    - Thay thế bằng logic: Lấy danh sách Order -> Thu thập danh sách product_id -> Gọi Service Catalog để lấy thông tin Product -> Map dữ liệu lại trong code.

- Cấu hình Environment:
    - Trong file .env, thay vì 1 biến DATABASE_URL, bạn phải khai báo 3 biến: IDENTITY_DB_URL, CATALOG_DB_URL, ORDER_DB_URL.

=> Nhiệm vụ này chỉ được coi là xong khi: có 3 file Prisma schema riêng biệt, chạy npx prisma generate cho từng file không báo lỗi. Dự án Monolith cũ vẫn chạy được nhưng các module gọi dữ liệu của nhau thông qua Service Layer chứ không qua DB Relation.
### INTER-SERVICE Communication:
Mục tiêu: Thiết lập cách thức các Service nói chuyện với nhau mà không cần "chọc" vào DB của nhau. Chúng ta sẽ sử dụng phương pháp "Kiềng ba chân": gRPC (Đồng bộ), Kafka (Bất đồng bộ) và Redis (Caching).

1. Triển khai gRPC cho truy vấn dữ liệu (Synchronous)
Khi Order Service cần thông tin chi tiết của một sản phẩm để tính giá, nó không được dùng REST API (vì chậm và tốn tài nguyên). Bạn phải dùng gRPC.

- Yêu cầu kỹ thuật: 
    - Định nghĩa file .proto (Protocol Buffers) cho Catalog Service. File này mô tả các hàm như GetProductById hoặc CheckStock.
    - Sử dụng thư viện @grpc/grpc-js và @grpc/proto-loader.

- Mệnh lệnh:
    - Mọi request lấy dữ liệu "đọc" (Read-only) giữa các service phải đi qua gRPC.
    - Phải có cơ chế Timeout (ví dụ: quá 500ms không phản hồi thì phải ngắt kết nối) để tránh làm sập toàn bộ chuỗi service.

2. Triển khai Kafka cho thay đổi trạng thái (Asynchronous)
Khi một đơn hàng được tạo thành công, Order Service không được đợi Inventory Service trừ kho xong mới trả kết quả cho khách. Nó phải bắn một "sự kiện".

- Yêu cầu kỹ thuật:
    - Sử dụng thư viện kafkajs để tích hợp vào Node.js.
    - Order Service (Producer): Sau khi lưu Order vào DB, phải phát một Event order.placed vào Kafka topic.
    - Inventory Service (Consumer): Lắng nghe topic order.placed để tự động trừ số lượng tồn kho trong DB của chính nó.

- Mệnh lệnh:
    - Dữ liệu trong Kafka Payload phải được chuẩn hóa (Schema) để tránh việc Service nhận dữ liệu bị lỗi cấu trúc.
    - Phải triển khai Retry Logic: Nếu Inventory Service bận, nó phải thử lại tin nhắn đó tối đa 3 lần trước khi đẩy vào Dead Letter Queue (DLQ).

3. Triển khai Sidecar Cache (Redis)
Để giảm tải cho gRPC và tránh việc gọi nhau quá nhiều, bạn phải áp dụng Caching.

- Mệnh lệnh:
    - Order Service khi lấy được thông tin Product từ gRPC, phải lưu vào Redis với TTL (Time-to-live) ngắn (ví dụ: 5 phút).
    - Lần gọi tiếp theo cho cùng một Product, hệ thống phải ưu tiên đọc từ Redis thay vì gọi sang Catalog Service.

=> Nhiệm vụ này chỉ được coi là xong khi:
- Bạn có thể tắt hoàn toàn Catalog Service mà Order Service vẫn có thể xử lý các đơn hàng có sản phẩm đã được lưu trong Cache (Redis).
- Log hệ thống hiển thị rõ ràng luồng: Order Placed -> Kafka Message Sent -> Inventory Updated.
- Không còn bất kỳ dòng code axios hay fetch nào được dùng để gọi nội bộ giữa các Service.

### IMPLEMENT DISTRIBUTED TRANSACTIONS (SAGA PATTERN)
Mục tiêu: Đảm bảo tính nhất quán dữ liệu giữa Order Service và Inventory Service thông qua các giao dịch bù đắp (Compensating Transactions).

1. Quy trình "Luồng hạnh phúc" (Happy Path)
Đây là khi mọi thứ đều thành công:
- Order Service: Tạo một đơn hàng trong DB_ORDER với trạng thái PENDING.
- Order Service: Bắn một sự kiện OrderCreated vào Kafka.
- Inventory Service: Lắng nghe sự kiện, thực hiện trừ kho trong DB_CATALOG.
- Inventory Service: Nếu thành công, bắn sự kiện InventoryReserved vào Kafka.
- Order Service: Lắng nghe InventoryReserved, cập nhật trạng thái đơn hàng thành CONFIRMED.

2. Quy trình "Bù đắp" (Compensating Path)
Đây là khi có lỗi xảy ra (ví dụ: hết hàng):
- Inventory Service: Kiểm tra kho thấy hết hàng, bắn sự kiện InventoryFailed vào Kafka.
- Order Service: Lắng nghe InventoryFailed.
- Mệnh lệnh: Bạn phải thực hiện hàm cancelOrder() để chuyển trạng thái từ PENDING sang CANCELLED và bắn thông báo cho khách hàng.
- Lưu ý: Tuyệt đối không xóa record, chỉ cập nhật trạng thái để phục vụ việc Audit sau này.

3. Kỹ thuật bắt buộc: Transactional Outbox Pattern
Một sai lầm chết người của Dev là: Save DB xong rồi mới Send Kafka. Nếu DB save xong mà mạng lag không send được Kafka, hệ thống sẽ bị sai lệch dữ liệu.

- Yêu cầu kỹ thuật: Trong mỗi Database (DB_ORDER, DB_CATALOG), bạn phải tạo thêm một bảng tên là Outbox.
    - Khi tạo Order, bạn phải dùng Prisma Transaction để vừa lưu Order, vừa lưu Message vào bảng Outbox trong cùng một lượt ghi.
    - Một Worker (hoặc dùng thư viện như Debezium) sẽ quét bảng Outbox này để đẩy tin nhắn vào Kafka. Điều này đảm bảo: Nếu DB đã ghi, chắc chắn Kafka sẽ có tin.

4. Tính Idempotency (Chống trùng lặp)
Mạng có thể chập chờn khiến Kafka gửi một tin nhắn 2 lần.

- Mệnh lệnh:
    - Inventory Service khi nhận tin OrderCreated, phải kiểm tra xem order_id này đã được xử lý chưa trước khi trừ kho.
    - Bạn phải lưu một bảng ProcessedEvents để đánh dấu các tin nhắn đã xử lý.

* LƯU Ý Tôi yêu cầu sự phối hợp chặt chẽ như sau:
- Backend & Database: Bạn phải cập nhật lại 3 file Prisma Schema để thêm bảng Outbox và bảng ProcessedEvents như đã lệnh ở trên.
- Backend & Logic: Toàn bộ logic "trạng thái đơn hàng" (Pending, Confirmed, Cancelled) phải được định nghĩa tập trung trong thư viện @kinshop/shared để tất cả các Service đều dùng chung một bộ hằng số.

### API GATEWAY & CENTRALIZED AUTHENTICATION
Mục tiêu: Thiết lập một điểm truy cập duy nhất (Single Entry Point) và tập trung hóa việc xác thực người dùng để các service bên trong (Order, Catalog) không phải tự xử lý lại logic Login/JWT.

1. Trích xuất Identity Service
- Dựa trên module auth và user hiện có trong kinshop_be, bạn phải tách chúng thành một Service độc lập.
- Quản lý Token: Kế thừa logic JWT và Refresh Token hiện tại.
- Role-based Access Control (RBAC): Giữ nguyên phân quyền Admin/User.

- Mệnh lệnh: Identity Service là nơi duy nhất được phép truy cập vào DB_IDENTITY. Mọi service khác nếu muốn biết thông tin User phải gọi qua gRPC hoặc lấy từ Header do Gateway chuyển xuống.

2. Cấu hình API Gateway (Kong)
- Thay vì để Client gọi trực tiếp vào từng Service, Client chỉ được gọi vào Gateway.

- Routing: Cấu hình Gateway để điều hướng request:

/api/v1/auth/* -> Identity Service.

/api/v1/products/* -> Catalog Service.

/api/v1/orders/* -> Order Service.

- Authentication Plugin: Sử dụng Plugin JWT của Kong để xác thực token ngay tại "cửa ngõ". Nếu Token không hợp lệ hoặc hết hạn, Gateway phải trả về lỗi 401 ngay lập tức, không cho phép request đi sâu vào các service nội bộ.

- Security: Cấu hình Rate Limiting và CORS tập trung tại đây thay vì để ở từng module như trước.

3. Cơ chế Token Passthrough (Chuyển tiếp định danh)
- Khi một request đã vượt qua Gateway, các service bên trong cần biết "Ai đang gọi?".

Mệnh lệnh:
- Gateway sau khi verify JWT sẽ trích xuất user_id và role từ payload.
- Nó sẽ đính kèm thông tin này vào Custom Headers (ví dụ: x-user-id, x-user-role) trước khi forward request đến service đích.
- Tại các Service con (như Order Service), bạn phải viết một Middleware đơn giản để đọc các Header này thay vì phải verify JWT lại lần nữa.

=> Tiêu chí hoàn thành (Definition of Done):
- Tính bảo mật: Bạn thử gọi trực tiếp vào Port của Order Service từ bên ngoài, request phải bị chặn (chỉ cho phép Gateway gọi vào).
- Tính tập trung: Khi bạn đổi Secret Key của JWT, bạn chỉ cần đổi và restart Identity Service + Gateway, các service khác không bị ảnh hưởng.
- Hợp nhất: Toàn bộ hệ thống Backend giờ đây chỉ lộ ra một cổng duy nhất (ví dụ: port 8000 của Gateway).

## TỔNG KẾT GIAI ĐOẠN BACKEND
- Tách Shared Library.
- Xé lẻ Database.
- Thiết lập giao tiếp gRPC/Kafka.
- Xử lý Transaction phân tán (Saga).
- Dựng rào chắn API Gateway.
    