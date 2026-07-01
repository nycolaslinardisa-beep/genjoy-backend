const db = require('../config/database');

const Product = {
  // Find all products with optional filters
  findAll: async ({ search, category }) => {
    try {
      let queryText = 'SELECT * FROM products';
      const queryParams = [];

      const conditions = [];

      if (search) {
        queryParams.push(`%${search}%`);
        conditions.push(`(name ILIKE $${queryParams.length} OR description ILIKE $${queryParams.length})`);
      }

      if (category) {
        queryParams.push(category);
        conditions.push(`category = $${queryParams.length}`);
      }

      if (conditions.length > 0) {
        queryText += ' WHERE ' + conditions.join(' AND ');
      }

      queryText += ' ORDER BY id DESC';

      const { rows } = await db.query(queryText, queryParams);
      return rows;
    } catch (error) {
      console.error('Erro de banco de dados em Product.findAll:', error);
      throw error;
    }
  },

  // Find product by id
  findById: async (id) => {
    try {
      const queryText = 'SELECT * FROM products WHERE id = $1';
      const { rows } = await db.query(queryText, [id]);
      return rows[0];
    } catch (error) {
      console.error('Erro de banco de dados em Product.findById:', error);
      throw error;
    }
  },

  // Create a new product
  create: async ({ name, description, original_price, promo_price, image_url, category, stock }) => {
    try {
      const queryText = `
        INSERT INTO products (name, description, original_price, promo_price, image_url, category, stock)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const values = [name, description, original_price, promo_price || null, image_url, category, stock || 0];
      const { rows } = await db.query(queryText, values);
      return rows[0];
    } catch (error) {
      console.error('Erro de banco de dados em Product.create:', error);
      throw error;
    }
  },

  // Update a product
  update: async (id, { name, description, original_price, promo_price, image_url, category, stock }) => {
    try {
      const queryText = `
        UPDATE products
        SET name = $1, description = $2, original_price = $3, promo_price = $4, image_url = $5, category = $6, stock = $7
        WHERE id = $8
        RETURNING *
      `;
      const values = [name, description, original_price, promo_price || null, image_url, category, stock, id];
      const { rows } = await db.query(queryText, values);
      return rows[0];
    } catch (error) {
      console.error('Erro de banco de dados em Product.update:', error);
      throw error;
    }
  },

  // Delete a product
  delete: async (id) => {
    try {
      const queryText = 'DELETE FROM products WHERE id = $1 RETURNING *';
      const { rows } = await db.query(queryText, [id]);
      return rows[0];
    } catch (error) {
      console.error('Erro de banco de dados em Product.delete:', error);
      throw error;
    }
  }
};

module.exports = Product;
