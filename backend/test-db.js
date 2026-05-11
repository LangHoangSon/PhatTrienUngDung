const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '123456',
    database: 'restaurant_qr'
  });

  const [tables] = await connection.query('SELECT * FROM tables');
  console.log('Tables:', tables);

  const [orders] = await connection.query('SELECT * FROM orders');
  console.log('Orders:', orders);

  const [orderItems] = await connection.query('SELECT * FROM order_items');
  console.log('Order Items:', orderItems);

  // Setup chat_messages table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      table_id INT,
      sender ENUM('customer', 'staff'),
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_read BOOLEAN DEFAULT FALSE
    )
  `);
  console.log('Created chat_messages table');

  await connection.end();
}
main();
