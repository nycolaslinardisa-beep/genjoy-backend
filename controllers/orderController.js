const db = require('../config/database');

const orderController = {
  // POST /api/orders - Create a new order
  createOrder: async (req, res) => {
    const client = await db.connect();
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Os itens do carrinho são obrigatórios para criar um pedido.' });
      }

      // Calculate total price
      let total_price = 0;
      for (const item of items) {
        if (!item.id || !item.price || !item.quantity) {
          return res.status(400).json({ error: 'Dados dos itens incorretos (id, preço ou quantidade ausente).' });
        }
        total_price += parseFloat(item.price) * parseInt(item.quantity);
      }

      // Generate a user-friendly order number (GJ + timestamp + 4 random digits)
      const order_number = `GJ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await client.query('BEGIN');

      // Insert order
      const orderQuery = `
        INSERT INTO orders (order_number, total_price, status)
        VALUES ($1, $2, $3)
        RETURNING id, order_number, total_price, status, created_at
      `;
      const orderResult = await client.query(orderQuery, [order_number, total_price, 'Pendente']);
      const orderId = orderResult.rows[0].id;

      // Insert order items
      const itemQuery = `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)
      `;
      for (const item of items) {
        await client.query(itemQuery, [orderId, item.id, item.quantity, item.price]);
      }

      await client.query('COMMIT');
      res.status(250).json(orderResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao criar pedido:', error);
      res.status(500).json({ error: 'Erro interno do servidor ao registrar pedido.' });
    } finally {
      client.release();
    }
  },

  // GET /api/orders - List all orders (Admin only)
  getOrders: async (req, res) => {
    try {
      const { rows } = await db.query('SELECT * FROM orders ORDER BY id DESC');
      res.json(rows);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      res.status(500).json({ error: 'Erro interno do servidor ao carregar pedidos.' });
    }
  },

  // GET /api/orders/:id/items - Get all items of an order
  getOrderItems: async (req, res) => {
    try {
      const { id } = req.params;
      const queryText = `
        SELECT oi.*, p.name, p.image_url 
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `;
      const { rows } = await db.query(queryText, [id]);
      res.json(rows);
    } catch (error) {
      console.error('Erro ao buscar itens do pedido:', error);
      res.status(500).json({ error: 'Erro interno do servidor ao carregar itens do pedido.' });
    }
  },

  // PUT /api/orders/:id/status - Update order status and subtract stock on Concluído
  updateOrderStatus: async (req, res) => {
    const client = await db.connect();
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'O status do pedido é obrigatório.' });
      }

      // Check current order status
      const orderQuery = 'SELECT status FROM orders WHERE id = $1';
      const orderRes = await client.query(orderQuery, [id]);

      if (orderRes.rows.length === 0) {
        return res.status(404).json({ error: 'Pedido não encontrado.' });
      }

      const currentStatus = orderRes.rows[0].status;

      await client.query('BEGIN');

      // Update status
      const updateStatusQuery = 'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *';
      const updateResult = await client.query(updateStatusQuery, [status, id]);

      // If transition to Concluído and wasn't already completed, decrease stock
      if (status === 'Concluído' && currentStatus !== 'Concluído') {
        // Fetch items
        const itemsQuery = 'SELECT product_id, quantity FROM order_items WHERE order_id = $1';
        const itemsRes = await client.query(itemsQuery, [id]);

        // Update each product stock
        const updateStockQuery = 'UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2';
        for (const item of itemsRes.rows) {
          await client.query(updateStockQuery, [item.quantity, item.product_id]);
        }
      }

      await client.query('COMMIT');
      res.json(updateResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao atualizar status do pedido:', error);
      res.status(500).json({ error: 'Erro interno do servidor ao atualizar pedido.' });
    } finally {
      client.release();
    }
  }
};

module.exports = orderController;
