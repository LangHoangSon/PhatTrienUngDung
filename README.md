# Project - Food Ordering at Restaurant
# MÔ TẢ DỰ ÁN

## Ý tưởng

Dự án xây dựng một hệ thống gọi món trong nhà hàng bằng mã QR (QR Ordering System).
Khách hàng khi đến nhà hàng có thể quét mã QR được đặt trên bàn để truy cập vào menu trực tuyến và đặt món trực tiếp từ điện thoại mà không cần gọi nhân viên phục vụ.

Hệ thống sẽ giúp nhà hàng giảm thời gian chờ đợi, giảm sai sót khi ghi nhận order và tối ưu quy trình phục vụ. Khi khách đặt món, đơn hàng sẽ được gửi trực tiếp đến hệ thống quản lý của nhà bếp hoặc nhân viên.

Nhóm chọn đề tài này vì các hệ thống gọi món bằng QR hiện nay được sử dụng khá phổ biến trong các quán café và nhà hàng. Tuy nhiên, việc xây dựng một hệ thống đơn giản mô phỏng quy trình này sẽ giúp nhóm hiểu rõ hơn về cách thiết kế một ứng dụng web full-stack, bao gồm frontend, backend và database.

Điểm khác biệt của project là sử dụng QR code để xác định bàn ngồi của khách, từ đó hệ thống tự động gắn order với bàn tương ứng. Điều này giúp đơn giản hóa quá trình gọi món và giảm thao tác nhập liệu của người dùng.

---

## Chi tiết

Hệ thống gồm các thành phần chính sau:

1. **Khách hàng (Customer)**

   * Quét QR code đặt trên bàn bằng điện thoại.
   * Truy cập vào trang menu của nhà hàng.
   * Xem danh sách món ăn và giá.
   * Chọn món và gửi yêu cầu đặt món (order).

2. **Hệ thống Backend**

   * Nhận request từ frontend.
   * Lưu thông tin đơn hàng vào database.
   * Quản lý trạng thái của đơn hàng.

3. **Nhân viên / Nhà bếp (Kitchen / Staff)**

   * Xem danh sách các đơn hàng mới.
   * Cập nhật trạng thái đơn hàng (pending, preparing, done, paid).

4. **Database**
   Lưu trữ các thông tin chính của hệ thống:

   * tables (danh sách bàn)
   * menu_items (danh sách món ăn)
   * orders (đơn hàng)
   * order_items (chi tiết món trong đơn)

Quy trình hoạt động của hệ thống:

1. Khách quét QR code trên bàn.
2. Hệ thống mở trang menu với thông tin bàn tương ứng.
3. Khách chọn món và gửi order.
4. Backend nhận request và lưu order vào database.
5. Nhân viên hoặc bếp có thể xem danh sách order và xử lý.

run backend:

node server.js

run frontend:

npm install

npm run dev

