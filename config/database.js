const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'catalog_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

pool.on('connect', () => {
  console.log('Banco de dados PostgreSQL conectado com sucesso!');
});

pool.on('error', (err) => {
  console.error('Erro inesperado no cliente PostgreSQL', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
