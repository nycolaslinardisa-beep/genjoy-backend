const Product = require('../models/productModel');

const productController = {
  // GET /api/products
  getProducts: async (req, res) => {
    try {
      const { search, category } = req.query;
      const products = await Product.findAll({ search, category });
      res.json(products);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      res.status(500).json({ error: 'Erro interno do servidor ao buscar produtos.' });
    }
  },

  // GET /api/products/:id
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }
      
      res.json(product);
    } catch (error) {
      console.error('Erro ao buscar produto por ID:', error);
      res.status(500).json({ error: 'Erro interno do servidor ao buscar produto.' });
    }
  },

  // POST /api/products
  createProduct: async (req, res) => {
    try {
      const { name, description, price, image_url, category, stock } = req.body;

      // Basic validation
      if (!name || !price || !category) {
        return res.status(400).json({ error: 'Os campos nome, preço e categoria são obrigatórios.' });
      }

      if (isNaN(price) || price < 0) {
        return res.status(400).json({ error: 'O preço deve ser um número maior ou igual a zero.' });
      }

      if (stock !== undefined && (isNaN(stock) || stock < 0)) {
        return res.status(400).json({ error: 'O estoque deve ser um número maior ou igual a zero.' });
      }

      const newProduct = await Product.create({
        name,
        description,
        price,
        image_url: image_url || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80', // generic tech image placeholder
        category,
        stock: stock ? parseInt(stock) : 0,
      });

      res.status(201).json(newProduct);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      res.status(500).json({ error: 'Erro interno do servidor ao cadastrar produto.' });
    }
  },

  // PUT /api/products/:id
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, price, image_url, category, stock } = req.body;

      // Check if product exists
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }

      // Basic validation
      if (!name || !price || !category) {
        return res.status(400).json({ error: 'Os campos nome, preço e categoria são obrigatórios.' });
      }

      if (isNaN(price) || price < 0) {
        return res.status(400).json({ error: 'O preço deve ser um número maior ou igual a zero.' });
      }

      if (stock !== undefined && (isNaN(stock) || stock < 0)) {
        return res.status(400).json({ error: 'O estoque deve ser um número maior ou igual a zero.' });
      }

      const updatedProduct = await Product.update(id, {
        name,
        description,
        price,
        image_url: image_url || existingProduct.image_url,
        category,
        stock: parseInt(stock),
      });

      res.json(updatedProduct);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      res.status(500).json({ error: 'Erro interno do servidor ao atualizar produto.' });
    }
  },

  // DELETE /api/products/:id
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedProduct = await Product.delete(id);

      if (!deletedProduct) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }

      res.json({ message: 'Produto deletado com sucesso!', product: deletedProduct });
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      res.status(500).json({ error: 'Erro interno do servidor ao deletar produto.' });
    }
  }
};

module.exports = productController;
