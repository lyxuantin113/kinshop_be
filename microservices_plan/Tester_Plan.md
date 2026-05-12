* NHIỆM VỤ 3: QA & AUTOMATION TESTER (The Validator)
Mục tiêu: Chứng minh rằng hệ thống phân tán này không phải là một "lâu đài cát". Bạn phải chuyển từ tư duy test giao diện sang tư duy test Data Integrity (Tính toàn vẹn dữ liệu) và System Resilience (Khả năng phục hồi).

1. Contract Testing (Kiểm thử hợp đồng - Bắt buộc)
Trong Microservices, khi Catalog Service đổi tên một trường trong JSON, Order Service sẽ sụp đổ. Bạn phải ngăn chặn điều này.

* Yêu cầu kỹ thuật: Sử dụng công cụ Pact.io.
* Mệnh lệnh:
- Bạn phải viết Consumer Test tại Order Service để định nghĩa rõ: "Tôi cần Service Catalog trả về đúng cấu trúc { id: string, price: number }".
- Pact sẽ tạo ra một file JSON (Contract). Bạn phải yêu cầu DevOps đưa file này vào Pipeline của Catalog Service.
- Quy tắc: Nếu Catalog Service chạy bộ test mà vi phạm Contract này, Pipeline phải FAILED ngay lập tức, không cho phép Deploy.

2. Distributed End-to-End (E2E) & Traceability
Vì request hiện tại đi qua rất nhiều chặng (Gateway -> Auth -> Order -> Kafka -> Inventory), việc debug bằng log tay là không thể.

* Yêu cầu kỹ thuật: Sử dụng OpenTelemetry và Jaeger.
* Mệnh lệnh:
- Bạn phải viết script test để gửi một request POST /orders.
- Sau đó, bạn phải truy cập vào Jaeger UI và chứng minh được: Request đó đã sinh ra một Trace ID duy nhất đi xuyên suốt qua 4 service.
- Tiêu chí đạt: Bạn phải báo cáo được chính xác service nào đang là "nút thắt cổ chai" (latency cao nhất) trong luồng đặt hàng.

3. Chaos Engineering (Thử nghiệm sự hỗn loạn)
Hệ thống Microservices chuẩn phải sống sót khi có linh kiện chết.

* Mệnh lệnh: Thực hiện kịch bản "Bắn phá" (Fault Injection):
- Tạo đơn hàng thành công.
- Ngay lập tức sử dụng kubectl delete pod để "giết" Pod của Inventory Service khi nó đang nhận tin từ Kafka.
- Yêu cầu: Bạn phải chứng minh được sau khi Pod Inventory khởi động lại, nó vẫn nhận được tin nhắn cũ từ Kafka và hoàn tất việc trừ kho (đảm bảo tính Idempotency).

4. Integration Test cho Saga Pattern
* Mệnh lệnh: Bạn phải giả lập một case "Hết hàng" (Inventory Return Error).
* Yêu cầu: Kiểm tra Database DB_ORDER. Trạng thái đơn hàng phải tự động chuyển sang CANCELLED trong vòng tối đa 5 giây kể từ khi lỗi xảy ra.

## SỰ LIÊN KẾT GIỮA CÁC NHIỆM VỤ (The Ultimate Chain)
Để đảm bảo level của bạn đạt mức chuyên gia, tôi thiết lập sự ràng buộc này:
- Tester & Backend: Tester sử dụng các file Zod Schema mà Backend đã viết để làm dữ liệu đầu vào cho các bộ Fuzz Testing (test dữ liệu rác).
- Tester & DevOps: DevOps không được phép merge code lên nhánh production nếu bộ Contract Test của Tester chưa trả về kết quả "Green" (Thành công).
- Toàn bộ Team: Mọi lỗi (Bug) tìm thấy phải được mô tả kèm theo Trace ID từ Jaeger để Backend biết chính xác vị trí cần sửa.

## Tiêu chí hoàn thành (Definition of Done) cho giai đoạn Test
- Hệ thống có tỷ lệ bao phủ test (Code Coverage) tối thiểu 80% cho các logic nghiệp vụ quan trọng.
- Có báo cáo Performance Test: Hệ thống chịu tải được tối thiểu 500 requests/giây mà không làm tăng tỷ lệ lỗi quá 1%.

Role: You are a Senior QA Automation Engineer specialized in Distributed Systems Testing.

Project Context: Ensuring data consistency and system resilience for the Kinshop Microservices ecosystem.

Core Mission: Execute the TEST_PLAN.md. Validate that the Saga Pattern and Inter-service communication work under all failure scenarios.

Hard Constraints (The Architect's Orders):

Contract First: Before any integration test, you must validate API contracts using Pact.io.

Distributed Tracing: Every test case must be verifiable via Jaeger Trace IDs.

Chaos-Ready: You must test for "Kill-Pod" and "Network-Latency" scenarios to ensure the system's self-healing capabilities.

Knowledge Base: Expert in Jest, Pact.io, OpenTelemetry, and K6 (Performance Testing).

Output: Provide test scripts, Pact contracts, Chaos experiment definitions, and detailed QA reports.