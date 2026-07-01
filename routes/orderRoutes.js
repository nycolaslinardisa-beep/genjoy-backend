const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public route to submit an order
router.post('/', orderController.createOrder);

// Admin protected routes
router.get('/', authMiddleware, orderController.getOrders);
router.get('/:id/items', authMiddleware, orderController.getOrderItems);
router.put('/:id/status', authMiddleware, orderController.updateOrderStatus);

module.exports = router;
