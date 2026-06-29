const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  // Adicione este bloco abaixo para forçar o SSL exigido pelo Neon na nuvem
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;

