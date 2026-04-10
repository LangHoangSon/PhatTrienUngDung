# Báo cáo & Quy trình cho nhân viên/Bếp

## 1. Mục đích
Tài liệu này mô tả cách nhân viên/bếp theo dõi và cập nhật trạng thái đơn hàng trong hệ thống đặt món bằng QR.

Hiện tại hệ thống cung cấp API để:
- xem bàn có đơn chưa thanh toán
- xem chi tiết món trong đơn
- cập nhật trạng thái đơn theo vòng đời: `pending -> preparing -> done -> paid`

## 2. Vai trò và dữ liệu liên quan
- **Nhân viên/Bếp**
  - Theo dõi danh sách bàn có đơn chưa `paid`
  - Lấy chi tiết món trong từng đơn
  - Cập nhật trạng thái theo tiến trình phục vụ
- **Đơn hàng (orders)**
  - thuộc về 1 bàn (`table_id`)
  - có trạng thái (`status`) và tổng tiền (`total_price`)
- **Chi tiết đơn (order_items)**
  - liệt kê món, số lượng, và đơn giá tại thời điểm tạo đơn

## 3. Trạng thái đơn (status) và ý nghĩa vận hành
- `pending`: đơn mới tạo, bếp chưa bắt đầu chế biến
- `preparing`: đang chế biến/chuẩn bị
- `done`: đã sẵn sàng để phục vụ cho bàn
- `paid`: đã thanh toán (trạng thái kết thúc)

## 4. Quy trình làm việc (theo ca)
### 4.1 Bắt đầu ca
1. Kiểm tra danh sách bàn đang có đơn chưa `paid` bằng API:
   - `GET /api/tables`
2. Nếu dùng dashboard thủ công (Postman/console), ghi lại các `table_number` có `order_id`.

### 4.2 Tiếp nhận và xử lý đơn
Với mỗi bàn có đơn:
1. Xem chi tiết món:
   - `GET /api/orders/:id/items`
2. Cập nhật trạng thái khi bắt đầu làm:
   - `PATCH /api/orders/:id/status` với body: `{ "status": "preparing" }`
3. Khi hoàn thành món:
   - `PATCH /api/orders/:id/status` với body: `{ "status": "done" }`

### 4.3 Chốt thanh toán
- Khi khách thanh toán, cập nhật trạng thái:
  - `PATCH /api/orders/:id/status` với body: `{ "status": "paid" }`
- Sau khi `paid`, bàn sẽ không còn xuất hiện trong danh sách “chưa paid” của `GET /api/tables` (do backend lọc `orders.status != 'paid'` trong JOIN).

## 5. Mẫu báo cáo cuối ca (bạn có thể copy dán)
Bạn có thể dùng mẫu dưới đây để tổng hợp bằng tay từ `GET /api/orders` hoặc `GET /api/tables`.

**BÁO CÁO CUỐI CA**
- Ca: …… (sáng/chiều/tối)
- Ngày: ……/……/……
- Nhân viên/Bếp trưởng: ………………………

| Bàn | Order ID | Trạng thái cuối | Thời gian tạo | Tổng tiền | Ghi chú |
|---|---:|---|---|---:|---|
| 1 |  |  |  |  |  |
| 2 |  |  |  |  |  |
| ... |  |  |  |  |  |

**Danh sách đơn cần hỗ trợ/ghi nhận**
- Đơn #…: lý do ……
- Đơn #…: lý do ……

## 6. Lưu ý quan trọng (để tránh sai sót)
- Hiện chưa có phân quyền/auth: bất kỳ ai có quyền gọi API đều có thể cập nhật status. Khi triển khai thực tế nên bổ sung xác thực cho nhân viên.
- Giá món do backend tính lại từ DB tại thời điểm tạo đơn. Vì vậy báo cáo doanh thu theo `orders.total_price` là nguồn chính.

## 7. Endpoint tham khảo (Quick API)
- Danh sách bàn có đơn chưa `paid`:
  - `GET /api/tables`
- Danh sách đơn (lọc theo status ở phía bạn):
  - `GET /api/orders`
- Chi tiết món theo order:
  - `GET /api/orders/:id/items`
- Cập nhật trạng thái:
  - `PATCH /api/orders/:id/status` với body `{ "status": "pending|preparing|done|paid" }`

