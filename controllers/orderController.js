const { Order } = require('../models/order.model');
// const { Cart } = require('../models/cart.model');
const Cart = {}
const { Product } = require('../models/product.model');

class OrderController {
  // Get all orders
  async getOrders(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;

      const query = { memberId: req.user._id };
      if (status) {
        query.status = status;
      }

      const orders = await Order.find(query)
        .sort({ orderDate: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('items.productId');

      const total = await Order.countDocuments(query);

      res.status(200).json({
        orders,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get Orders Error:', error);
      res.status(500).json({ message: 'Error fetching orders' });
    }
  }

  // Get order details
  async getOrderDetails(req, res) {
    try {
      const { orderId } = req.params;

      const order = await Order.findOne({
        _id: orderId,
        memberId: req.user._id
      }).populate('items.productId');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.status(200).json(order);
    } catch (error) {
      console.error('Get Order Details Error:', error);
      res.status(500).json({ message: 'Error fetching order details' });
    }
  }

  // Create order from cart
  async createOrder(req, res) {
    try {
      const { shippingAddress, paymentMethod } = req.body;

      // Get cart
      const cart = await Cart.findOne({ memberId: req.user._id })
        .populate('items.productId');

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
      }

      // Validate stock availability
      for (const item of cart.items) {
        const product = item.productId;
        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.name}`,
            availableStock: product.stock
          });
        }
      }

      // Create order
      const order = new Order({
        memberId: req.user._id,
        items: cart.items.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: cart.total,
        status: 'pending',
        shippingAddress,
        paymentDetails: {
          method: paymentMethod,
          status: 'pending'
        },
        orderDate: new Date()
      });

      // Save order
      await order.save();

      // Update product stock
      for (const item of cart.items) {
        await Product.findByIdAndUpdate(item.productId._id, {
          $inc: { stock: -item.quantity }
        });
      }

      // Clear cart
      await Cart.findByIdAndDelete(cart._id);

      // Create payment intent (integrate with your payment gateway)
      const paymentIntent = await createPaymentIntent(order);

      res.status(201).json({
        order,
        paymentUrl: paymentIntent.paymentUrl,
        paymentId: paymentIntent.id
      });
    } catch (error) {
      console.error('Create Order Error:', error);
      res.status(500).json({ message: 'Error creating order' });
    }
  }

  // Cancel order
  async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;

      const order = await Order.findOne({
        _id: orderId,
        memberId: req.user._id,
        status: 'pending'
      });

      if (!order) {
        return res.status(404).json({
          message: 'Order not found or cannot be cancelled'
        });
      }

      // Update order status
      order.status = 'cancelled';
      await order.save();

      // Restore product stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity }
        });
      }

      // Handle payment refund if necessary
      if (order.paymentDetails.status === 'completed') {
        await processRefund(order);
      }

      res.status(200).json({
        message: 'Order cancelled successfully',
        order
      });
    } catch (error) {
      console.error('Cancel Order Error:', error);
      res.status(500).json({ message: 'Error cancelling order' });
    }
  }

  // Update order status (admin only)
  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      // Verify user is admin
      if (req.user.userType !== 'admin') {
        return res.status(403).json({
          message: 'Unauthorized to update order status'
        });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      order.status = status;
      await order.save();

      res.status(200).json(order);
    } catch (error) {
      console.error('Update Order Status Error:', error);
      res.status(500).json({ message: 'Error updating order status' });
    }
  }
}

// Helper function to create payment intent
async function createPaymentIntent(order) {
  // Implement your payment gateway integration here
  // This is a placeholder implementation
  return {
    id: 'pi_' + Date.now(),
    paymentUrl: `https://payment-gateway.com/pay/${order._id}`,
    amount: order.totalAmount
  };
}

// Helper function to process refund
async function processRefund(order) {
  // Implement your refund logic here
  // This is a placeholder implementation
  console.log(`Processing refund for order ${order._id}`);
}

module.exports = new OrderController();
