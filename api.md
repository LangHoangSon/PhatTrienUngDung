# 🍽 Restaurant QR Ordering System – API Documentation

Base URL

http://localhost:5000

---

# 1️⃣ Get Menu

Get all available menu items.

Endpoint

GET /api/menu

Response

[
{
"id": 1,
"name": "Cơm gà",
"price": 35000,
"image_url": null,
"is_available": 1
},
{
"id": 2,
"name": "Trà đào",
"price": 25000,
"image_url": null,
"is_available": 1
}
]

---

# 2️⃣ Create Order

Create a new order for a table.

Endpoint

POST /api/orders

Request Body

{
"table_id": 3,
"items": [
{
"menu_id": 1,
"quantity": 2
},
{
"menu_id": 2,
"quantity": 1
}
]
}

Response

{
"message": "Order created",
"order_id": 5,
"total": 95000
}

---

# 3️⃣ Get Orders

Get all orders.

Endpoint

GET /api/orders

Response

[
{
"id": 1,
"table_number": 3,
"status": "pending",
"total_price": 95000,
"created_at": "2026-03-05T11:20:00.000Z"
}
]

---

# 4️⃣ Get Order Items

Get items inside an order.

Endpoint

GET /api/orders/:id/items

Example

GET /api/orders/1/items

Response

[
{
"name": "Cơm gà",
"quantity": 2,
"unit_price": 35000
},
{
"name": "Trà đào",
"quantity": 1,
"unit_price": 25000
}
]

---

# 5️⃣ Update Order Status

Update order status.

Endpoint

PATCH /api/orders/:id/status

Request Body

{
"status": "preparing"
}

Available Status

pending
preparing
done
paid

---

# 6️⃣ Get Tables

Get all restaurant tables.

Endpoint

GET /api/tables

Response

[
{
"id": 1,
"table_number": 1
},
{
"id": 2,
"table_number": 2
}
]
