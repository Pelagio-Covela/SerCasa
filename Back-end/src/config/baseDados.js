const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // sem isto, colunas DECIMAL (latitude, longitude, preco_por_hora, avaliacao)
  // vêm como texto (ex: "-25.96920000") em vez de número — o que quebra
  // o mapa (Leaflet) no Front-end e no Backoffice.
  decimalNumbers: true,
});

module.exports = pool;