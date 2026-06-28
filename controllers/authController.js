const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'genjoy_jwt_secret_key_123';

const authController = {
  // POST /api/auth/register
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Basic validation
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres.' });
      }

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Este e-mail já está em uso.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const newUser = await User.create({
        name,
        email,
        passwordHash,
      });

      // Generate JWT Token
      const token = jwt.sign(
        { id: newUser.id, name: newUser.name, email: newUser.email },
        JWT_SECRET,
        { expiresIn: '7d' } // Expires in 7 days
      );

      res.status(201).json({
        message: 'Usuário cadastrado com sucesso!',
        token,
        user: newUser,
      });
    } catch (error) {
      console.error('Erro no registro do usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor ao registrar usuário.' });
    }
  },

  // POST /api/auth/login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      }

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
      }

      // Generate JWT Token
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login realizado com sucesso!',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      console.error('Erro no login do usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor ao autenticar usuário.' });
    }
  },

  // GET /api/auth/me (Verify session token status)
  me: async (req, res) => {
    try {
      // req.user is populated by authMiddleware
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      res.json(user);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      res.status(500).json({ error: 'Erro interno ao validar token.' });
    }
  }
};

module.exports = authController;
