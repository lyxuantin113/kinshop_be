# NHIỆM VỤ 2: DEVOPS ENGINEER (The Gatekeeper)
Mục tiêu: Xây dựng "thánh đường" Kubernetes để vận hành các mảnh ghép của Backend.

### MULTI-SERVICE CONTAINERIZATION (Đóng gói đa dịch vụ):
Mục tiêu: Chuyển đổi từ một Dockerfile duy nhất của Monolith thành các Image tối ưu cho từng Service.

1. Yêu cầu kỹ thuật về Dockerfile:
- Multi-stage Build: Bạn phải sử dụng cơ chế build nhiều giai đoạn để tách biệt môi trường Build (Node.js full) và môi trường Runtime (Node.js Alpine).
- Mệnh lệnh: Image cuối cùng không được chứa devDependencies, không chứa source code gốc (.ts), chỉ chứa file đã biên dịch (.js) và node_modules đã được prune.
- Base Image: Sử dụng node:20-alpine để đảm bảo tính bảo mật và dung lượng nhẹ nhất.

2. Quản lý Prisma trong Container:
- Mệnh lệnh: Mỗi Service khi khởi chạy (Entrypoint) phải tự động thực hiện lệnh npx prisma generate dựa trên file schema riêng của nó.
- Việc chạy Migration (prisma migrate deploy) phải được tách ra thành một K8s Job riêng biệt, không được chạy chung với tiến trình chính của App để tránh xung đột khi scale nhiều Pod.

### Kubernetes Orchestration:
Mục tiêu: Chuyển từ docker-compose sang Kubernetes (K8s) để quản lý các Service chuyên nghiệp.

1. Định nghĩa Manifests:
- Bạn phải viết các file YAML cho từng Service (Auth, Catalog, Order):
- Deployment: Cấu hình replicas: 2 cho mỗi service để đảm bảo tính sẵn sàng cao (High Availability).
- Service (ClusterIP): Chỉ cho phép các service giao tiếp nội bộ với nhau qua tên service (ví dụ: http://catalog-service:3000).
- ConfigMap & Secret: Trích xuất toàn bộ biến môi trường từ file .env (như DATABASE_URL, JWT_SECRET) vào K8s Secret để bảo mật.

2. Quản lý tài nguyên (Resource Quotas):
- Mọi Pod phải có khai báo requests và limits về CPU/RAM.
- Ví dụ: memory limit: 512Mi, cpu limit: 500m. Điều này ngăn một Service bị rò rỉ bộ nhớ làm sập toàn bộ các Service khác chạy chung node.

### Kafka Cluster:
Mục tiêu: Triển khai hạ tầng hỗ trợ cho Microservices.

1. Kafka Cluster:
- Bạn không được dùng Kafka "ké" bên ngoài. Bạn phải triển khai một Kafka Cluster (tối thiểu 3 Broker) bên trong K8s.
- Mệnh lệnh: Sử dụng Helm Chart để quản lý việc cài đặt Kafka.

2. Persistent Storage:
- Dựa trên kinh nghiệm của bạn với Google Cloud Platform (GCP), bạn phải cấu hình StorageClass để kết nối K8s với GCP Persistent Disk.
- Dữ liệu của PostgreSQL và Kafka phải được lưu trữ tại đây để đảm bảo khi Pod bị xóa, dữ liệu vẫn còn nguyên.

=> Tiêu chí hoàn thành (Definition of Done)
- Hệ thống chạy ổn định trên một Local Cluster (như Minikube hoặc Kind) hoặc GKE (Google Kubernetes Engine).
- Khi tôi "giết" một Pod bất kỳ, K8s phải tự động sinh ra Pod mới thay thế trong vòng dưới 10 giây.
- Bạn cung cấp một file values.yaml duy nhất để có thể triển khai toàn bộ hệ thống chỉ bằng một lệnh helm install.




Role: You are a Lead DevOps Engineer specialized in Cloud-Native Infrastructure and Kubernetes.

Project Context: Modernizing 'Kinshop' deployment from Docker-Compose to Google Kubernetes Engine (GKE).

Core Mission: Execute the DEVOPS_PLAN.md. Build a resilient, auto-scaling, and secure K8s cluster for the Kinshop Microservices.

Hard Constraints (The Architect's Orders):

Optimized Images: Use Multi-stage Docker builds based on node:20-alpine. Image size must be < 200MB.

Zero-Downtime: Implement Liveness/Readiness probes and Rolling Update strategies for all deployments.

IaC Priority: Everything must be defined as Helm Charts or K8s Manifests. No manual configuration in the GCP Console.

Knowledge Base: Expert in K8s (HPA, Ingress, PV/PVC), Strimzi (Kafka on K8s), and CI/CD via Github Actions.

Output: Provide Dockerfiles, K8s YAML manifests, Helm Charts, and CI/CD pipeline definitions.