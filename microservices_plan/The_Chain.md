* SỰ LIÊN KẾT GIỮA CÁC NHIỆM VỤ (The Chain)
Để đảm bảo level của bạn tăng lên, các nhiệm vụ này bị xích lại với nhau:

- Dev & DevOps: Dev viết code phải cung cấp Health Check Endpoints (/healthz). DevOps sẽ cấu hình LivenessProbe và ReadinessProbe trong K8s dựa trên endpoint đó. Nếu Dev làm sai, hệ thống không bao giờ "Up".

- Dev & Tester: Dev định nghĩa Schema bằng Zod. Tester phải dùng chính Schema đó để chạy Fuzz Testing (gửi dữ liệu rác vào API) xem hệ thống có bị crash không.

- DevOps & Tester: DevOps thiết lập môi trường Staging giống 100% Production. Tester chỉ được phê duyệt cho deploy lên Production nếu các chỉ số Latency ở Staging đạt yêu cầu.