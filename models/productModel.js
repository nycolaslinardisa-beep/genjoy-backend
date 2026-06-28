const db = require('../config/database');

const Product = {
  // Find all products with optional filters
  findAll: async ({ search, category }) => {
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
  },

  // Find product by id
  findById: async (id) => {
    const queryText = 'SELECT * FROM products WHERE id = $1';
    const { rows } = await db.query(queryText, [id]);
    return rows[0];
  },

  // Create a new product
  create: async ({ name, description, price, image_url, category, stock }) => {
    const queryText = `
      INSERT INTO products (name, description, price, image_url, category, stock)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [name, description, price, image_url, category, stock || 0];
    const { rows } = await db.query(queryText, values);
    return rows[0];
  },

  // Update a product
  update: async (id, { name, description, price, image_url, category, stock }) => {
    const queryText = `
      UPDATE products
      SET name = $1, description = $2, price = $3, image_url = $4, category = $5, stock = $6
      WHERE id = $7
      RETURNING *
    `;
    const values = [name, description, price, image_url, category, stock, id];
    const { rows } = await db.query(queryText, values);
    return rows[0];
  },

  // Delete a product
  delete: async (id) => {
    const queryText = 'DELETE FROM products WHERE id = $1 RETURNING *';
    const { rows } = await db.query(queryText, [id]);
    return rows[0];
  }
};

module.exports = Product;
