const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const db = require('./db');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`);
  }
});
const upload = multer({ storage: uploadStorage, limits: { fileSize: 3 * 1024 * 1024 } });
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
app.use('/uploads', express.static(uploadsDir));

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

  const frontendHost = process.env.FRONTEND_HOST || 'localhost';
  const [tables] = await db.promise().query(
    "SELECT table_number FROM tables"
  );

  const folder = path.join(__dirname, 'qrcodes');

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  for (const table of tables) {

    const url = `http://${frontendHost}:3000/menu?table=${table.table_number}`;

    const filePath = path.join(folder, `table-${table.table_number}.png`);

    await QRCode.toFile(filePath, url);

  }

  res.json({ message: "QR codes generated" });

});

// API Menu — trả về tất cả món (kể cả hết) để khách thấy overlay "Hết món"
app.get('/api/menu', (req, res) => {
  const sql = `SELECT * FROM menu_items ORDER BY id ASC`;
  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(result);
  });
});

// Thêm món: JSON { name, price, image_url? } hoặc multipart (name, price, file field "image")
app.post('/api/menu', upload.single('image'), async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const price = parseFloat(req.body.price, 10);
    let image_url = req.body.image_url != null && String(req.body.image_url).trim() !== ''
      ? String(req.body.image_url).trim()
      : null;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }
    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }
    if (Number.isNaN(price) || price < 0) {
      return res.status(400).json({ message: "invalid price" });
    }
    const [ins] = await db.promise().query(
      `INSERT INTO menu_items (name, price, image_url, is_available) VALUES (?, ?, ?, TRUE)`,
      [name, price, image_url]
    );
    res.json({
      id: ins.insertId,
      name,
      price,
      image_url,
      is_available: 1
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Create menu item failed" });
  }
});

// Cập nhật còn món / hết món
app.patch('/api/menu/:id', async (req, res) => {
  const id = req.params.id;
  const { is_available } = req.body;
  if (is_available === undefined) {
    return res.status(400).json({ message: "is_available is required" });
  }
  const val = is_available === true || is_available === 1 || is_available === '1' ? 1 : 0;
  try {
    const [r] = await db.promise().query(
      `UPDATE menu_items SET is_available = ? WHERE id = ?`,
      [val, id]
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    res.json({ message: "Menu availability updated", id: Number(id), is_available: val === 1 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Update failed" });
  }
});

// API Create Order
app.post('/api/orders', async (req, res) => {
  const { table_id, items } = req.body;

  if (!table_id || !items || items.length === 0) {
    return res.status(400).json({ message: "Invalid data" });
  }

  const conn = await db.promise().getConnection();

  try {
    await conn.beginTransaction();

    // 1. tạo order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (table_id, total_price) VALUES (?, 0)`,
      [table_id]
    );

    const orderId = orderResult.insertId;
    let totalPrice = 0;

    // 2. xử lý items
    for (const item of items) {
      const [menu] = await conn.query(
        `SELECT price FROM menu_items WHERE id = ?`,
        [item.menu_id]
      );

      const price = menu[0].price;
      totalPrice += price * item.quantity;

      await conn.query(
        `INSERT INTO order_items 
        (order_id, menu_item_id, quantity, unit_price, note, options)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.menu_id,
          item.quantity,
          price,
          item.note || null,
          JSON.stringify(item.options || [])
        ]
      );
    }

    // 3. update total
    await conn.query(
      `UPDATE orders SET total_price = ? WHERE id = ?`,
      [totalPrice, orderId]
    );

    await conn.commit();

    res.json({
      message: "Order created",
      order_id: orderId,
      total: totalPrice
    });

  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Create order failed" });
  } finally {
    conn.release();
  }
});

// app.post('/api/orders', async (req, res) => {

//   const { table_id, items } = req.body;

//   if (!table_id || !items || items.length === 0) {
//     return res.status(400).json({
//       message: "Invalid order data"
//     });
//   }

//   try {
//     const priceByMenuId = new Map();

//     for (const item of items) {
//       const [rows] = await db.promise().query(
//         `SELECT price, is_available FROM menu_items WHERE id = ?`,
//         [item.menu_id]
//       );
//       if (!rows.length) {
//         return res.status(400).json({
//           message: "Invalid menu item",
//           menu_id: item.menu_id
//         });
//       }
//       const row = rows[0];
//       const available = row.is_available === true || row.is_available === 1;
//       if (!available) {
//         return res.status(400).json({
//           message: "Món đã hết hoặc không phục vụ",
//           menu_id: item.menu_id
//         });
//       }
//       priceByMenuId.set(item.menu_id, Number(row.price));
//     }

//     const [orderResult] = await db.promise().query(
//       `INSERT INTO orders (table_id, total_price) VALUES (?, 0)`,
//       [table_id]
//     );

//     const orderId = orderResult.insertId;
//     let totalPrice = 0;

//     for (const item of items) {
//       const price = priceByMenuId.get(item.menu_id);
//       const itemTotal = price * item.quantity;
//       totalPrice += itemTotal;

//       await db.promise().query(
//         `INSERT INTO order_items
//         (order_id, menu_item_id, quantity, unit_price)
//         VALUES (?, ?, ?, ?)`,
//         [orderId, item.menu_id, item.quantity, price]
//       );
//     }

//     await db.promise().query(
//       `UPDATE orders SET total_price = ? WHERE id = ?`,
//       [totalPrice, orderId]
//     );

//     res.json({
//       message: "Order created successfully",
//       order_id: orderId,
//       total_price: totalPrice
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Create order failed" });
//   }
// });
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
        order_items.unit_price,
        order_items.note
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

app.get('/api/revenue', async (req, res) => {
  const { type } = req.query;

  let groupBy = "";
  let format = "";

  if (type === 'day') {
    format = "%Y-%m-%d";
  } else if (type === 'month') {
    format = "%Y-%m";
  } else if (type === 'year') {
    format = "%Y";
  } else {
    return res.status(400).json({ message: "Invalid type" });
  }

  try {
    const [rows] = await db.promise().query(`
      SELECT 
        DATE_FORMAT(created_at, '${format}') AS period,
        SUM(total_price) AS revenue
      FROM orders
      WHERE status = 'completed'
      GROUP BY period
      ORDER BY period DESC
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Revenue error" });
  }
});

app.post('/api/call-staff', async (req, res) => {
  const { table_id } = req.body;

  if (!table_id) {
    return res.status(400).json({ message: "Missing table_id" });
  }

  try {
    await db.promise().query(
      `INSERT INTO staff_calls (table_id) VALUES (?)`,
      [table_id]
    );

    res.json({ message: "Staff called" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Call failed" });
  }
});


// Get pending staff calls
app.get('/api/staff-calls', async (req, res) => {
  try {
    const [calls] = await db.promise().query(`
      SELECT staff_calls.*, tables.table_number 
      FROM staff_calls 
      JOIN tables ON staff_calls.table_id = tables.id 
      WHERE staff_calls.status = 'pending'
      ORDER BY staff_calls.created_at ASC
    `);
    res.json(calls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get calls" });
  }
});

// Resolve a staff call
app.patch('/api/staff-calls/:id', async (req, res) => {
  try {
    await db.promise().query(
      `UPDATE staff_calls SET status = 'resolved' WHERE id = ?`,
      [req.params.id]
    );
    res.json({ message: "Call resolved" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update call" });
  }
});

// Get chat messages for a specific table
app.get('/api/chat/:table_id', async (req, res) => {
  try {
    const [messages] = await db.promise().query(
      `SELECT * FROM chat_messages WHERE table_id = ? ORDER BY created_at ASC`,
      [req.params.table_id]
    );
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load chat" });
  }
});

// Get all chat messages (for staff overview)
app.get('/api/chat', async (req, res) => {
  try {
    const [messages] = await db.promise().query(
      `SELECT chat_messages.*, tables.table_number 
       FROM chat_messages 
       JOIN tables ON chat_messages.table_id = tables.id 
       ORDER BY created_at ASC`
    );
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load all chats" });
  }
});

// Send a chat message
app.post('/api/chat', async (req, res) => {
  const { table_id, sender, message } = req.body;
  if (!table_id || !sender || !message) {
    return res.status(400).json({ message: "Missing fields" });
  }
  try {
    const [result] = await db.promise().query(
      `INSERT INTO chat_messages (table_id, sender, message) VALUES (?, ?, ?)`,
      [table_id, sender, message]
    );

    // Auto-resolve "call staff" if staff replies
    if (sender === 'staff') {
      await db.promise().query(
        `UPDATE staff_calls SET status = 'resolved' WHERE table_id = ? AND status = 'pending'`,
        [table_id]
      );
    }

    const [newMessage] = await db.promise().query(
      `SELECT * FROM chat_messages WHERE id = ?`,
      [result.insertId]
    );
    res.json(newMessage[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send message" });
  }
});


app.post('/api/payment/:orderId', async (req, res) => {
  const { orderId } = req.params;

  try {
    const [orders] = await db.promise().query(
      `SELECT total_price FROM orders WHERE id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const amount = orders[0].total_price;

    // tạo payment record
    const [payment] = await db.promise().query(
      `INSERT INTO payments (order_id, amount) VALUES (?, ?)`,
      [orderId, amount]
    );

    // tạo QR content (fake payment link)
    const qrData = `PAYMENT|ORDER:${orderId}|AMOUNT:${amount}`;

    const folder = path.join(__dirname, 'qrcodes');
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);

    const filePath = path.join(folder, `payment-${orderId}.png`);

    await QRCode.toFile(filePath, qrData);

    res.json({
      message: "QR generated",
      payment_id: payment.insertId,
      qr: `/qrcodes/payment-${orderId}.png`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment failed" });
  }
});

app.put('/api/payment/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db.promise().query(
      `UPDATE payments SET status = ? WHERE id = ?`,
      [status, id]
    );

    res.json({ message: "Payment updated" });

  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});