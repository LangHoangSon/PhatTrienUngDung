DROP DATABASE IF EXISTS restaurant_qr;
CREATE DATABASE restaurant_qr;
USE restaurant_qr;

CREATE TABLE tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_number INT UNIQUE NOT NULL
);

CREATE TABLE menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_id INT,
    status ENUM('pending','preparing','done','paid') DEFAULT 'pending',
    total_price DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id)
);

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    menu_item_id INT,
    quantity INT,
    unit_price DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

INSERT INTO tables (table_number) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10);

INSERT INTO menu_items (name, price) VALUES 
('Phở', 40000),
('Cơm gà', 35000),
('Trà đào', 25000),
('Bún bò', 40000);
SET SQL_SAFE_UPDATES = 0;

UPDATE menu_items SET image_url = 'https://cdn.tgdd.vn/Files/2022/01/07/1409726/tong-hop-cong-thuc-lam-tra-dao-cuc-ngon-giai-nhiet-co-the-202201080743018481.jpg' WHERE name = 'Trà đào';
UPDATE menu_items SET image_url = 'https://static.vinwonders.com/production/com-ga-hue-1.jpg' WHERE name = 'Cơm gà';
UPDATE menu_items SET image_url = 'https://static.vinwonders.com/production/bun-bo-hue-cau-giay-1.jpg' WHERE name = 'Bún bò';
UPDATE menu_items SET image_url = 'https://cafefcdn.com/2018/7/19/photo-2-1531984647242593960017.png' WHERE name = 'Phở';
SET SQL_SAFE_UPDATES = 1;
SELECT * FROM menu_items;