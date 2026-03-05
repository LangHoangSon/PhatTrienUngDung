// db.js
const mysql = require('mysql2');

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'restaurant_qr'
});

module.exports = connection;