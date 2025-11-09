const { Product } = require('../models/product.model');
// const { Cart } = require('../models/cart.model');
const Cart = {}

class ProductController {
  // Get products with filtering and pagination
  async getProducts(req, res) {
    try {
      const { 
        category,
        page = 1,
        limit = 10,
        minPrice,
        maxPrice,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query
      const query = {};
      if (category) query.category = category;
      if (minPrice || maxPrice) {
        query.sellingPrice = {};
        if (minPrice) query.sellingPrice.$gte = Number(minPrice);
        if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
      }

      // Build sort options
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const products = await Product.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit));

      const total = await Product.countDocuments(query);

      res.status(200).json({
        products,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get Products Error:', error);
      res.status(500).json({ message: 'Error fetching products' });
    }
  }

  // Get product details
  async getProductDetails(req, res) {
    try {
      const { productId } = req.params;
      
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.status(200).json(product);
    } catch (error) {
      console.error('Get Product Details Error:', error);
      res.status(500).json({ message: 'Error fetching product details' });
    }
  }

  // Get product categories
  async getCategories(req, res) {
    try {
      const categories = await Product.distinct('category');
      res.status(200).json(categories);
    } catch (error) {
      console.error('Get Categories Error:', error);
      res.status(500).json({ message: 'Error fetching categories' });
    }
  }

  // Get cart
  async getCart(req, res) {
    try {
      let cart = await Cart.findOne({ memberId: req.user._id })
        .populate('items.productId');

      if (!cart) {
        cart = {
          memberId: req.user._id,
          items: [],
          total: 0
        };
      }

      res.status(200).json(cart);
    } catch (error) {
      console.error('Get Cart Error:', error);
      res.status(500).json({ message: 'Error fetching cart' });
    }
  }

  // Add to cart
  async addToCart(req, res) {
    try {
      const { productId, quantity } = req.body;

      // Validate product exists and has sufficient stock
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (product.stock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }

      // Find or create cart
      let cart = await Cart.findOne({ memberId: req.user._id });
      if (!cart) {
        cart = new Cart({
          memberId: req.user._id,
          items: [],
          total: 0
        });
      }

      // Check if product already in cart
      const existingItem = cart.items.find(
        item => item.productId.toString() === productId
      );

      if (existingItem) {
        // Update quantity if product already in cart
        existingItem.quantity += quantity;
        existingItem.price = product.sellingPrice;
      } else {
        // Add new item to cart
        cart.items.push({
          productId,
          quantity,
          price: product.sellingPrice
        });
      }

      // Calculate total
      cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      await cart.save();
      await cart.populate('items.productId');

      res.status(200).json(cart);
    } catch (error) {
      console.error('Add to Cart Error:', error);
      res.status(500).json({ message: 'Error adding item to cart' });
    }
  }

  // Update cart item
  async updateCartItem(req, res) {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;

      // Validate product exists and has sufficient stock
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (product.stock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }

      // Update cart
      const cart = await Cart.findOne({ memberId: req.user._id });
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }

      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Product not found in cart' });
      }

      if (quantity === 0) {
        // Remove item if quantity is 0
        cart.items.splice(itemIndex, 1);
      } else {
        // Update quantity
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].price = product.sellingPrice;
      }

      // Recalculate total
      cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      await cart.save();
      await cart.populate('items.productId');

      res.status(200).json(cart);
    } catch (error) {
      console.error('Update Cart Item Error:', error);
      res.status(500).json({ message: 'Error updating cart item' });
    }
  }

  // Clear cart
  async clearCart(req, res) {
    try {
      await Cart.findOneAndDelete({ memberId: req.user._id });
      res.status(200).json({ message: 'Cart cleared successfully' });
    } catch (error) {
      console.error('Clear Cart Error:', error);
      res.status(500).json({ message: 'Error clearing cart' });
    }
  }
}

module.exports = new ProductController();
