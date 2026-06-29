const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateSecret, verify, generateURI } = require('otplib');
const qrcode = require('qrcode');
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

      // Check if 2FA is enabled
      if (user.is_two_factor_enabled) {
        // Generate a short-lived temp token for 2FA validation step
        const tempToken = jwt.sign(
          { id: user.id, temp: true },
          JWT_SECRET,
          { expiresIn: '5m' } // 5 minutes
        );

        return res.json({
          requires2FA: true,
          tempToken,
          message: 'Autenticação de dois fatores requerida.'
        });
      }

      // Generate final JWT Token
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
          is_two_factor_enabled: false
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
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        is_two_factor_enabled: user.is_two_factor_enabled
      });
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      res.status(500).json({ error: 'Erro interno ao validar token.' });
    }
  },

  // POST /api/auth/2fa/setup (Generate secret and QR Code for setup)
  setup2FA: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const secret = generateSecret();
      const otpAuthUrl = generateURI({ secret, label: user.email, issuer: 'Genjoy' });
      const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);

      // Save secret temporarily (not fully enabled yet)
      await User.update2FA(user.id, { secret, enabled: false });

      res.json({
        secret,
        qrCode: qrCodeDataUrl
      });
    } catch (error) {
      console.error('Erro no setup do 2FA:', error);
      res.status(500).json({ error: 'Erro ao configurar autenticação de dois fatores.' });
    }
  },

  // POST /api/auth/2fa/enable (Confirm and enable 2FA after successful validation)
  enable2FA: async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: 'Código de verificação de 6 dígitos é obrigatório.' });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      if (!user.two_factor_secret) {
        return res.status(400).json({ error: 'Nenhum segredo de 2FA foi gerado. Inicie o setup primeiro.' });
      }

      const result = await verify({
        token,
        secret: user.two_factor_secret
      });

      if (!result.valid) {
        return res.status(400).json({ error: 'Código inválido. Tente novamente.' });
      }

      // Fully enable 2FA
      const updatedUser = await User.update2FA(user.id, {
        secret: user.two_factor_secret,
        enabled: true
      });

      res.json({
        message: 'Autenticação de dois fatores ativada com sucesso!',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          created_at: updatedUser.created_at,
          is_two_factor_enabled: true
        }
      });
    } catch (error) {
      console.error('Erro ao ativar 2FA:', error);
      res.status(500).json({ error: 'Erro ao ativar autenticação de dois fatores.' });
    }
  },

  // POST /api/auth/2fa/disable (Disable 2FA)
  disable2FA: async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: 'Código de verificação de 6 dígitos é obrigatório.' });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      if (!user.is_two_factor_enabled) {
        return res.status(400).json({ error: '2FA já está desativado para esta conta.' });
      }

      const result = await verify({
        token,
        secret: user.two_factor_secret
      });

      if (!result.valid) {
        return res.status(400).json({ error: 'Código inválido. Tente novamente.' });
      }

      // Disable 2FA
      const updatedUser = await User.update2FA(user.id, {
        secret: null,
        enabled: false
      });

      res.json({
        message: 'Autenticação de dois fatores desativada com sucesso!',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          created_at: updatedUser.created_at,
          is_two_factor_enabled: false
        }
      });
    } catch (error) {
      console.error('Erro ao desativar 2FA:', error);
      res.status(500).json({ error: 'Erro ao desativar autenticação de dois fatores.' });
    }
  },

  // POST /api/auth/2fa/login-2fa (Complete login using TOTP token)
  login2FA: async (req, res) => {
    try {
      const { tempToken, token } = req.body;
      if (!tempToken || !token) {
        return res.status(400).json({ error: 'Token temporário e código 2FA são obrigatórios.' });
      }

      // Verify the tempToken
      let decoded;
      try {
        decoded = jwt.verify(tempToken, JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ error: 'Sessão expirada. Por favor, faça login novamente.' });
      }

      if (!decoded.temp) {
        return res.status(400).json({ error: 'Token de autenticação inválido.' });
      }

      const user = await User.findById(decoded.id);
      if (!user || !user.is_two_factor_enabled) {
        return res.status(400).json({ error: 'Usuário inválido ou 2FA não ativado.' });
      }

      const result = await verify({
        token,
        secret: user.two_factor_secret
      });

      if (!result.valid) {
        return res.status(400).json({ error: 'Código 2FA inválido ou expirado.' });
      }

      // Generate final JWT Token
      const finalToken = jwt.sign(
        { id: user.id, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login realizado com sucesso!',
        token: finalToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
          is_two_factor_enabled: true
        },
      });
    } catch (error) {
      console.error('Erro no login do 2FA:', error);
      res.status(500).json({ error: 'Erro interno ao autenticar com 2FA.' });
    }
  }
};

module.exports = authController;
