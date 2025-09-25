const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = require('../config/email');

// ===================== NOTIFICATION HELPER =====================
const sendNotification = async (userId, title, message, type, data = {}) => {
  try {
    // TODO: Implement push notification service (FCM, OneSignal, etc.)
    // For now, we'll just log the notification
    console.log(`📱 NOTIFICATION: ${title} - ${message} (User: ${userId}, Type: ${type})`);
    
    // You can integrate with FCM, OneSignal, or other services here
    // Example structure for future implementation:
    /*
    const notification = {
      userId,
      title,
      message,
      type,
      data,
      timestamp: new Date()
    };
    
    // Send to notification service
    await notificationService.send(notification);
    */
  } catch (error) {
    console.error('Notification send error:', error);
  }
};

// Create order
// Create order
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    // Validate required shipping fields
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      return res.status(400).json({ error: 'Incomplete shipping address' });
    }

    // Process items
    let total = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.product}` });
      }
      if (!product.isActive) {
        return res.status(400).json({ error: `Product is not available: ${product.title}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.title}. Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }

      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        title: product.title
      });

      // Decrease stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Create order with new address fields
    const order = new Order({
      user: req.user.id,
      items: processedItems,
      total,
      shippingAddress: {
        nickname: shippingAddress.nickname || 'Home',
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country || 'India',
        latitude: shippingAddress.latitude,
        longitude: shippingAddress.longitude
      },
      paymentMethod: paymentMethod || 'cod',
      notes
    });

    await order.save();
    await order.populate('items.product', 'title images');

    // Get user details for email
    const user = await User.findById(req.user.id);
    
    // Send notification for order placed
    await sendNotification(
      req.user.id,
      'Order Placed Successfully! 🎉',
      `Your order #${order._id.toString().slice(-6)} has been placed successfully.`,
      'order_placed',
      { orderId: order._id, total: order.total }
    );

    // Send email confirmation
    if (user && user.email) {
      try {
        const emailResult = await sendOrderConfirmationEmail(order, user);
        if (emailResult.success) {
          console.log('✅ Order confirmation email sent successfully');
        } else {
          console.error('❌ Failed to send order confirmation email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Email sending error:', emailError);
      }
    }
    res.status(201).json({
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
};

// Get user orders
const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { user: req.user.id };
    if (status) {
      filter.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(filter)
      .populate('items.product', 'title images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      error: 'Failed to fetch orders'
    });
  }
};

// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.user = userId;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(filter)
      .populate('user', 'name phone')
      .populate('items.product', 'title images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      error: 'Failed to fetch orders'
    });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name phone')
      .populate('items.product', 'title images');
    
    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    // Users can only view their own orders (unless admin)
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      error: 'Failed to fetch order'
    });
  }
};

// Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status explicitly
    const allowedStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    // Find the order first
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'title images')
      .populate('user', 'name');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Optional: prevent invalid transitions
    const invalidTransitions = {
      delivered: ['placed', 'processing', 'shipped'], // once delivered, can't go back
      cancelled: ['delivered'] // cannot cancel delivered order
    };

    if (
      invalidTransitions[order.status] &&
      invalidTransitions[order.status].includes(status)
    ) {
      return res.status(400).json({
        error: `Cannot change status from ${order.status} to ${status}`
      });
    }

    // Update and save order
    order.status = status;
    await order.save();

    // Get user details for email
    const userForEmail = await User.findById(order.user._id);

    // Send notification for status change
    const statusMessages = {
      placed: 'Your order has been placed successfully! 📦',
      processing: 'Your order is now being processed! ⚙️',
      shipped: 'Your order has been shipped! 🚚',
      delivered: 'Your order has been delivered! ✅',
      cancelled: 'Your order has been cancelled. ❌'
    };

    await sendNotification(
      order.user._id,
      'Order Status Updated',
      statusMessages[status],
      'order_status_change',
      {
        orderId: order._id,
        status,
        orderNumber: order._id.toString().slice(-6)
      }
    );

    // Send email notification for status update
    if (userForEmail && userForEmail.email) {
      try {
        const emailResult = await sendOrderStatusUpdateEmail(order, userForEmail, status);
        if (emailResult.success) {
          console.log('✅ Order status update email sent successfully');
        } else {
          console.error('❌ Failed to send status update email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Email sending error:', emailError);
      }
    }
    return res.status(200).json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
};


module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrder,
  updateOrderStatus
};