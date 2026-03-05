const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./db');
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL");
    connection.release();
  }
});
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send("API is running...");
});

// Test DB
app.get('/test-db', (req, res) => {
  db.query('SELECT NOW() AS currentTime', (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});


// app.post('/api/setup-restaurant', async (req, res) => {

//   const { number_of_tables } = req.body;

//   if (!number_of_tables) {
//     return res.status(400).json({
//       message: "Please provide number_of_tables"
//     });
//   }

//   try {

//     const folder = path.join(__dirname, 'qrcodes');

//     if (!fs.existsSync(folder)) {
//       fs.mkdirSync(folder, { recursive: true });
//     }

//     for (let i = 1; i <= number_of_tables; i++) {

//       await db.promise().query(
//         `INSERT IGNORE INTO tables (table_number) VALUES (?)`,
//         [i]
//       );

//       const url = `http://localhost:3000/menu?table=${i}`;

//       const filePath = path.join(folder, `table-${i}.png`);

//       await QRCode.toFile(filePath, url);

//       console.log(`QR created for table ${i}`);

//     }

//     res.json({
//       message: `${number_of_tables} tables created with QR codes`
//     });

//   } catch (error) {

//     console.error("Setup error:", error);

//     res.status(500).json({
//       message: "Setup failed"
//     });

//   }

// });
app.get('/api/generate-qrs', async (req, res) => {

  const [tables] = await db.promise().query(
    "SELECT table_number FROM tables"
  );

  const folder = path.join(__dirname, 'qrcodes');

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  for (const table of tables) {

    const url = `http://localhost:3000/menu?table=${table.table_number}`;

    const filePath = path.join(folder, `table-${table.table_number}.png`);

    await QRCode.toFile(filePath, url);

  }

  res.json({ message: "QR codes generated" });

});

// API Menu
app.get('/api/menu', (req, res) => {

  const sql = `
    SELECT * 
    FROM menu_items
    WHERE is_available = TRUE
  `;

  db.query(sql, (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({
        message: "Database error"
      });
    }

    res.json(result);

  });

});

// API Create Order
app.post('/api/orders', async (req, res) => {

  const { table_id, items } = req.body;

  if (!table_id || !items || items.length === 0) {
    return res.status(400).json({
      message: "Invalid order data"
    });
  }

  try {

    // 1️⃣ tạo order
    const [orderResult] = await db.promise().query(
      `INSERT INTO orders (table_id, total_price) VALUES (?, 0)`,
      [table_id]
    );

    const orderId = orderResult.insertId;

    let totalPrice = 0;

    // 2️⃣ xử lý từng món
    for (const item of items) {

      const [priceResult] = await db.promise().query(
        `SELECT price FROM menu_items WHERE id = ?`,
        [item.menu_id]
      );

      const price = priceResult[0].price;

      const itemTotal = price * item.quantity;

      totalPrice += itemTotal;

      await db.promise().query(
        `INSERT INTO order_items
        (order_id, menu_item_id, quantity, unit_price)
        VALUES (?, ?, ?, ?)`,
        [orderId, item.menu_id, item.quantity, price]
      );

    }

    // 3️⃣ update tổng tiền
    await db.promise().query(
      `UPDATE orders SET total_price = ? WHERE id = ?`,
      [totalPrice, orderId]
    );

    res.json({
      message: "Order created successfully",
      order_id: orderId,
      total_price: totalPrice
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Create order failed"
    });

  }
});
//API Get Orders
app.get('/api/orders', async (req, res) => {

  try {

    const [orders] = await db.promise().query(`
      SELECT 
        orders.id,
        tables.table_number,
        orders.status,
        orders.total_price,
        orders.created_at
      FROM orders
      JOIN tables 
      ON orders.table_id = tables.id
      ORDER BY orders.created_at DESC
    `);

    res.json(orders);

  } catch (error) {

    console.error("Get orders error:", error);

    res.status(500).json({
      message: "Failed to fetch orders"
    });

  }

});
  

// API Get Order Items
app.get('/api/orders/:id/items', async (req, res) => {

  const orderId = req.params.id;

  try {

    const [items] = await db.promise().query(`
      SELECT 
        menu_items.name,
        order_items.quantity,
        order_items.unit_price
      FROM order_items
      JOIN menu_items
      ON order_items.menu_item_id = menu_items.id
      WHERE order_items.order_id = ?
    `, [orderId]);

    res.json(items);

  } catch (error) {

    console.error("Get order items error:", error);

    res.status(500).json({
      message: "Failed to fetch order items"
    });

  }

});

// patch update order status
app.patch('/api/orders/:id/status', async (req, res) => {

  const orderId = req.params.id;
  const { status } = req.body;

  try {

    await db.promise().query(
      `UPDATE orders SET status = ? WHERE id = ?`,
      [status, orderId]
    );

    res.json({
      message: "Order status updated"
    });

  } catch (error) {

    console.error("Update status error:", error);

    res.status(500).json({
      message: "Failed to update status"
    });

  }

});


app.get('/api/tables', async (req, res) => {

  try {

    const [tables] = await db.promise().query(`
      SELECT 
        tables.id,
        tables.table_number,
        orders.id AS order_id,
        orders.status
      FROM tables
      LEFT JOIN orders 
      ON tables.id = orders.table_id 
      AND orders.status != 'paid'
    `);

    res.json(tables);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to fetch tables"
    });

  }

});

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});