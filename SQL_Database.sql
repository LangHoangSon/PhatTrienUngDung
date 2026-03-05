create database restaurant_qr

use restaurant_qr

-- 2. Tạo bảng bàn ăn (Dùng [tables] vì tables là từ khóa hệ thống)
CREATE TABLE [tables] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    table_number INT UNIQUE NOT NULL
);

-- 3. Tạo bảng món ăn
CREATE TABLE menu_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255),
    price DECIMAL(10,2),
    category NVARCHAR(100),
    image_url NVARCHAR(MAX),
    is_available BIT DEFAULT 1 -- Trong SQL Server dùng BIT (1 = True)
);

-- 4. Tạo bảng đơn hàng
CREATE TABLE orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    table_id INT,
    status NVARCHAR(50) DEFAULT 'pending',
    total_price DECIMAL(10,2),
    created_at DATETIME DEFAULT GETDATE(), -- Dùng GETDATE() để lấy thời gian hiện tại
    CONSTRAINT FK_Orders_Tables FOREIGN KEY (table_id) REFERENCES [tables](id)
);

-- 5. Tạo bảng chi tiết đơn hàng
CREATE TABLE order_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT,
    menu_item_id INT,
    quantity INT,
    unit_price DECIMAL(10,2),
    CONSTRAINT FK_Items_Orders FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT FK_Items_Menu FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- 6. Chèn dữ liệu mẫu
INSERT INTO [tables] (table_number) VALUES (1), (2), (3);

INSERT INTO menu_items (name, price, category, is_available)
VALUES 
(N'Phở', 50000, N'Food', 1),
(N'Trà sữa', 30000, N'Drink', 1),
(N'Cơm tấm', 45000, N'Food', 1);