const db = require('../config/database');

const User = {
  // Find a user by email
  findByEmail: async (email) => {
    try {
      const queryText = 'SELECT * FROM users WHERE email = $1';
      const { rows } = await db.query(queryText, [email]);
      return rows[0];
    } catch (error) {
      console.error('Erro de banco de dados em User.findByEmail:', error);
      throw error;
    }
  },

  // Create a new user
  create: async ({ name, email, passwordHash }) => {
    try {
      const queryText = `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, created_at
      `;
      const values = [name, email, passwordHash];
      const { rows } = await db.query(queryText, values);
      return rows[0];
    } catch (error) {
      console.error('Erro de banco de dados em User.create:', error);
      throw error;
    }
  },

  // Find a user by ID
  findById: async (id) => {
    try {
      const queryText = 'SELECT id, name, email, created_at, two_factor_secret, is_two_factor_enabled FROM users WHERE id = $1';
      const { rows } = await db.query(queryText, [id]);
      return rows[0];
    } catch (error) {
      console.error('Erro de banco de dados em User.findById:', error);
      throw error;
    }
  },

  // Update Two-Factor Authentication fields
  update2FA: async (id, { secret, enabled }) => {
    try {
      const queryText = `
        UPDATE users
        SET two_factor_secret = $1, is_two_factor_enabled = $2
        WHERE id = $3
        RETURNING id, name, email, created_at, two_factor_secret, is_two_factor_enabled
      `;
      const values = [secret, enabled, id];
      const { rows } = await db.query(queryText, values);
      return rows[0];
    } catch (error) {
      console.error('Erro de banco de dados em User.update2FA:', error);
      throw error;
    }
  }
};

module.exports = User;
