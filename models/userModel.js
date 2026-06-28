const db = require('../config/database');

const User = {
  // Find a user by email
  findByEmail: async (email) => {
    const queryText = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await db.query(queryText, [email]);
    return rows[0];
  },

  // Create a new user
  create: async ({ name, email, passwordHash }) => {
    const queryText = `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at
    `;
    const values = [name, email, passwordHash];
    const { rows } = await db.query(queryText, values);
    return rows[0];
  },

  // Find a user by ID
  findById: async (id) => {
    const queryText = 'SELECT id, name, email, created_at FROM users WHERE id = $1';
    const { rows } = await db.query(queryText, [id]);
    return rows[0];
  }
};

module.exports = User;
