const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = require('../config/email');

const { sendNotificationToDevice } = require('../config/firebase'); // ✅ import Firebase service

// ===================== NOTIFICATION HELPER =====================

// ===================== NOTIFICATION HELPER =====================
// ===================== NOTIFICATION HELPER =====================
const sendNotification = async (userId, title, message, type, data = {}) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      console.warn(`⚠️ User not found for notification: ${userId}`);
      return;
    }

    if (!user.fcmToken) { 
      console.warn(`⚠️ No FCM token for user: ${userId}`);
      return;
    }

    // 🔑 Ensure all data values are strings
    const stringifyData = {};
    for (const key in data) {
      stringifyData[key] = String(data[key]);
    }

    // Send push notification
    const result = await sendNotificationToDevice(
      user.fcmToken,
      title,
      message,
      { ...stringifyData, type }  // also add type as string
    );

    console.log(`📱 Notification sent to ${user.name || userId}:`, result);
  } catch (error) {
    console.error('❌ Notification send error:', error);
  }
};


// ===================== ORDER CONTROLLERS =====================

// Create order
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      return res.status(400).json({ error: 'Incomplete shipping address' });
    }

    let total = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(400).json({ error: `Product not found: ${item.product}` });
      if (!product.isActive) return res.status(400).json({ error: `Product is not available: ${product.title}` });
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

      product.stock -= item.quantity;
      await product.save();
    }

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

    const user = await User.findById(req.user.id);

    // ✅ Send push notification
    await sendNotification(
      req.user.id,
      'Order Placed Successfully! 🎉',
      `Your order #${order._id.toString().slice(-6)} has been placed successfully.`,
      'order_placed',
      { orderId: order._id, total: order.total }
    );

    // ✅ Send email confirmation
    if (user && user.email) {
      try {
        const emailResult = await sendOrderConfirmationEmail(order, user);
        if (emailResult.success) console.log('✅ Order confirmation email sent');
        else console.error('❌ Failed to send order confirmation email:', emailResult.error);
      } catch (emailError) {
        console.error('❌ Email sending error:', emailError);
      }
    }

    res.status(201).json({ message: 'Order placed successfully', order });
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

// Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    const order = await Order.findById(req.params.id)
      .populate('items.product', 'title images')
      .populate('user', 'name');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const invalidTransitions = {
      delivered: ['placed', 'processing', 'shipped'],
      cancelled: ['delivered']
    };

    if (invalidTransitions[order.status] && invalidTransitions[order.status].includes(status)) {
      return res.status(400).json({ error: `Cannot change status from ${order.status} to ${status}` });
    }

    order.status = status;
    await order.save();

    const statusMessages = {
      placed: 'Your order has been placed successfully! 📦',
      processing: 'Your order is now being processed! ⚙️',
      shipped: 'Your order has been shipped! 🚚',
      delivered: 'Your order has been delivered! ✅',
      cancelled: 'Your order has been cancelled. ❌'
    };

    // ✅ Push notification
    await sendNotification(
      order.user._id,
      'Order Status Updated',
      statusMessages[status],
      'order_status_change',
      { orderId: order._id, status, orderNumber: order._id.toString().slice(-6) }
    );

    // ✅ Email notification
    const userForEmail = await User.findById(order.user._id);
    if (userForEmail && userForEmail.email) {
      try {
        const emailResult = await sendOrderStatusUpdateEmail(order, userForEmail, status);
        if (emailResult.success) console.log('✅ Order status email sent');
        else console.error('❌ Failed to send status email:', emailResult.error);
      } catch (emailError) {
        console.error('❌ Email sending error:', emailError);
      }
    }

    res.status(200).json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Cancel order (User only - their own orders)
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'title images')
      .populate('user', 'name');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Users can only cancel their own orders
    if (order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only cancel your own orders' });
    }

    // Check if order can be cancelled
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({ error: 'Cannot cancel delivered orders' });
    }

    if (order.status === 'shipped') {
      return res.status(400).json({ error: 'Cannot cancel shipped orders. Please contact support.' });
    }

    // Restore stock for cancelled items
    for (const item of order.items) {
      const product = await Product.findById(item.product._id);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    // Send notification for cancellation
    await sendNotification(
      order.user._id,
      'Order Cancelled',
      `Your order #${order._id.toString().slice(-6)} has been cancelled successfully.`,
      'order_cancelled',
      {
        orderId: order._id,
        orderNumber: order._id.toString().slice(-6)
      }
    );

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder
};






