const express = require('express');
const { query, body, param } = require('express-validator');
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validator');

const router = express.Router();

// Validation middleware
const getProductsValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('sortBy').optional().isIn(['createdAt', 'price', 'name']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
];

const addToCartValidation = [
  body('productId').isMongoId().withMessage('Invalid product ID'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

const updateCartValidation = [
  param('productId').isMongoId().withMessage('Invalid product ID'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be 0 or greater')
];

// Product routes
router.get('/',
  auth,
  getProductsValidation,
  validate,
  productController.getProducts
);

router.get('/categories',
  auth,
  productController.getCategories
);

router.get('/:productId',
  auth,
  param('productId').isMongoId(),
  validate,
  productController.getProductDetails
);

// Cart routes
router.get('/cart',
  auth,
  productController.getCart
);

router.post('/cart',
  auth,
  addToCartValidation,
  validate,
  productController.addToCart
);

router.put('/cart/:productId',
  auth,
  updateCartValidation,
  validate,
  productController.updateCartItem
);

router.delete('/cart',
  auth,
  productController.clearCart
);

module.exports = router;
