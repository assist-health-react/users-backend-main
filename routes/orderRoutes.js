const express = require('express');
const { body, query, param } = require('express-validator');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validator');

const router = express.Router();

// Validation middleware
const createOrderValidation = [
  body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
  body('paymentMethod').isIn(['card', 'upi', 'netbanking']).withMessage('Invalid payment method')
];

const getOrdersValidation = [
  query('status').optional().isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
];

const updateOrderStatusValidation = [
  param('orderId').isMongoId().withMessage('Invalid order ID'),
  body('status').isIn(['confirmed', 'shipped', 'delivered']).withMessage('Invalid status')
];

// Routes
router.get('/',
  auth,
  getOrdersValidation,
  validate,
  orderController.getOrders
);

router.get('/:orderId',
  auth,
  param('orderId').isMongoId(),
  validate,
  orderController.getOrderDetails
);

router.post('/',
  auth,
  createOrderValidation,
  validate,
  orderController.createOrder
);

router.post('/:orderId/cancel',
  auth,
  param('orderId').isMongoId(),
  validate,
  orderController.cancelOrder
);

router.patch('/:orderId/status',
  auth,
  updateOrderStatusValidation,
  validate,
  orderController.updateOrderStatus
);

module.exports = router;
