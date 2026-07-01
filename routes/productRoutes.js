const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Product CRUD routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Protected routes (require valid JWT)
router.post('/', authMiddleware, upload.single('image'), productController.createProduct);
router.put('/:id', authMiddleware, upload.single('image'), productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;
