// db.js
const mysql = require('mysql2');

const connection = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '', // XAMPP mặc định là rỗng
  database: 'restaurant_qr'
});

module.exports = connection;



