const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Evita crash do processo Node por promessas não capturadas ou exceções
process.on('unhandledRejection', (reason, promise) => {
  console.error('Rejeição não tratada no servidor:', promise, 'motivo:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Exceção não tratada no servidor:', error);
});


const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Body parser middleware
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

const db = require('./config/database');
app.get('/api/categories', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM categories ORDER BY id ASC');
    if (!rows || rows.length === 0) {
      return res.status(500).json({ error: 'Nenhuma categoria encontrada ou banco de dados vazio.' });
    }
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno ao buscar categorias.' });
  }
});

// Base route for server checking
app.get('/', (req, res) => {
  res.json({
    message: 'API do Catálogo de Produtos MVC está rodando!',
    version: '1.0.0',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`URL base do produto: http://localhost:${PORT}/api/products`);
});
