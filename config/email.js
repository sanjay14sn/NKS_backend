const sgMail = require('@sendgrid/mail');

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email templates
const emailTemplates = {
  orderPlaced: (order, user) => ({
    to: user.email,
    from: {
      email: process.env.FROM_EMAIL,
      name: process.env.FROM_NAME || 'Shopping App Store'
    },
    subject: `🎉 Order Confirmation - #${order._id.toString().slice(-6)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
          .header-subtitle { font-size: 16px; opacity: 0.9; }
          .content { padding: 30px; }
          .order-info { background: #f8f9ff; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #667eea; }
          .order-header { margin-bottom: 20px; }
          .order-number { font-size: 28px; font-weight: bold; color: #667eea; margin-bottom: 5px; }
          .order-date { color: #666; font-size: 14px; }
          .section-title { font-size: 18px; font-weight: bold; color: #333; margin: 25px 0 15px 0; border-bottom: 2px solid #eee; padding-bottom: 8px; }
          .item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #eee; }
          .item:last-child { border-bottom: none; }
          .item-details { flex: 1; }
          .item-name { font-weight: bold; color: #333; margin-bottom: 5px; }
          .item-qty { color: #666; font-size: 14px; }
          .item-price { font-weight: bold; color: #667eea; font-size: 16px; }
          .total-section { background: #667eea; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .total-amount { font-size: 24px; font-weight: bold; }
          .address-section { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .address-title { font-weight: bold; color: #333; margin-bottom: 10px; }
          .status-badge { display: inline-block; background: #28a745; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
          .footer-logo { font-size: 20px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
          .social-links { margin: 15px 0; }
          .social-links a { color: #667eea; text-decoration: none; margin: 0 10px; }
          @media (max-width: 600px) {
            .container { margin: 0; }
            .content { padding: 20px; }
            .item { flex-direction: column; align-items: flex-start; }
            .item-price { margin-top: 5px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🛍️ Shopping App</div>
            <div class="header-subtitle">Your order has been confirmed!</div>
          </div>
          
          <div class="content">
            <div class="order-info">
              <div class="order-header">
                <div class="order-number">Order #${order._id.toString().slice(-6)}</div>
                <div class="order-date">Placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
                <div style="margin-top: 10px;">
                  <span class="status-badge">${order.status.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div class="section-title">📦 Order Items</div>
            ${order.items.map(item => `
              <div class="item">
                <div class="item-details">
                  <div class="item-name">${item.title}</div>
                  <div class="item-qty">Quantity: ${item.quantity}</div>
                </div>
                <div class="item-price">₹${item.price.toLocaleString('en-IN')}</div>
              </div>
            `).join('')}

            <div class="total-section">
              <div style="margin-bottom: 5px;">Total Amount</div>
              <div class="total-amount">₹${order.total.toLocaleString('en-IN')}</div>
            </div>

            <div class="section-title">🚚 Shipping Address</div>
            <div class="address-section">
              <div class="address-title">${order.shippingAddress.nickname || 'Delivery Address'}</div>
              <div>${order.shippingAddress.street}</div>
              <div>${order.shippingAddress.city}, ${order.shippingAddress.state}</div>
              <div>${order.shippingAddress.zipCode}, ${order.shippingAddress.country || 'India'}</div>
            </div>

            <div class="section-title">💳 Payment Information</div>
            <div style="padding: 15px 0;">
              <strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}
              <br>
              <strong>Payment Status:</strong> 
              <span style="color: ${order.paymentStatus === 'completed' ? '#28a745' : '#ffc107'};">
                ${order.paymentStatus.toUpperCase()}
              </span>
            </div>

            ${order.notes ? `
              <div class="section-title">📝 Special Instructions</div>
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                ${order.notes}
              </div>
            ` : ''}

            <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
              <h3 style="color: #0066cc; margin-bottom: 10px;">📱 Track Your Order</h3>
              <p style="margin: 0; color: #666;">We'll send you updates as your order progresses. You can also track your order in the app.</p>
            </div>
          </div>

          <div class="footer">
            <div class="footer-logo">Shopping App</div>
            <p>Thank you for shopping with us! 🙏</p>
            <div class="social-links">
              <a href="#">Help Center</a> |
              <a href="#">Contact Us</a> |
              <a href="#">Track Order</a>
            </div>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
              This email was sent to ${user.email}. If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Order Confirmation - #${order._id.toString().slice(-6)}
      
      Hi ${user.name},
      
      Thank you for your order! Here are the details:
      
      Order Number: #${order._id.toString().slice(-6)}
      Order Date: ${new Date(order.createdAt).toLocaleDateString()}
      Status: ${order.status.toUpperCase()}
      
      Items:
      ${order.items.map(item => `- ${item.title} (Qty: ${item.quantity}) - ₹${item.price}`).join('\n')}
      
      Total: ₹${order.total}
      
      Shipping Address:
      ${order.shippingAddress.street}
      ${order.shippingAddress.city}, ${order.shippingAddress.state}
      ${order.shippingAddress.zipCode}
      
      Payment Method: ${order.paymentMethod.toUpperCase()}
      
      We'll send you updates as your order progresses.
      
      Thank you for shopping with us!
      Shopping App Team
    `
  }),

  orderStatusUpdate: (order, user, newStatus) => ({
    to: user.email,
    from: {
      email: process.env.FROM_EMAIL,
      name: process.env.FROM_NAME || 'Shopping App Store'
    },
    subject: `📦 Order Update - #${order._id.toString().slice(-6)} is now ${newStatus}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 30px; text-align: center; }
          .status-update { background: #f8f9ff; padding: 30px; border-radius: 12px; margin: 20px 0; }
          .status-icon { font-size: 48px; margin-bottom: 15px; }
          .status-text { font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
          .order-number { font-size: 18px; color: #666; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ Shopping App</h1>
            <p>Order Status Update</p>
          </div>
          
          <div class="content">
            <div class="status-update">
              <div class="status-icon">
                ${newStatus === 'processing' ? '⚙️' : 
                  newStatus === 'shipped' ? '🚚' : 
                  newStatus === 'delivered' ? '✅' : 
                  newStatus === 'cancelled' ? '❌' : '📦'}
              </div>
              <div class="status-text">Your order is now ${newStatus.toUpperCase()}</div>
              <div class="order-number">Order #${order._id.toString().slice(-6)}</div>
            </div>
            
            <p>Hi ${user.name},</p>
            <p>We wanted to let you know that your order status has been updated.</p>
            
            ${newStatus === 'shipped' ? '<p><strong>Your order is on its way! 🎉</strong></p>' : ''}
            ${newStatus === 'delivered' ? '<p><strong>Your order has been delivered! We hope you love it! 💝</strong></p>' : ''}
          </div>

          <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p>Shopping App Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  welcomeEmail: (user) => ({
    to: user.email,
    from: {
      email: process.env.FROM_EMAIL,
      name: process.env.FROM_NAME || 'Shopping App Store'
    },
    subject: `Welcome to Shopping App! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Shopping App</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 30px; }
          .welcome-section { background: #f8f9ff; padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; }
          .feature { display: flex; align-items: center; padding: 15px 0; border-bottom: 1px solid #eee; }
          .feature:last-child { border-bottom: none; }
          .feature-icon { font-size: 24px; margin-right: 15px; }
          .feature-text { flex: 1; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🛍️ Shopping App</div>
            <div>Welcome to our family!</div>
          </div>
          
          <div class="content">
            <div class="welcome-section">
              <h2 style="color: #667eea; margin-bottom: 15px;">Hi ${user.name}! 👋</h2>
              <p>Thank you for joining Shopping App! We're excited to have you on board.</p>
            </div>

            <h3 style="color: #333; margin: 25px 0 15px 0;">What you can do with Shopping App:</h3>
            
            <div class="feature">
              <div class="feature-icon">🛒</div>
              <div class="feature-text">
                <strong>Shop Quality Products</strong><br>
                Browse thousands of electrical products and accessories
              </div>
            </div>
            
            <div class="feature">
              <div class="feature-icon">❤️</div>
              <div class="feature-text">
                <strong>Save Favorites</strong><br>
                Keep track of products you love for easy reordering
              </div>
            </div>
            
            <div class="feature">
              <div class="feature-icon">📦</div>
              <div class="feature-text">
                <strong>Track Orders</strong><br>
                Get real-time updates on your order status and delivery
              </div>
            </div>
            
            <div class="feature">
              <div class="feature-icon">🚚</div>
              <div class="feature-text">
                <strong>Fast Delivery</strong><br>
                Quick and reliable delivery to your doorstep
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="#" class="cta-button">Start Shopping Now</a>
            </div>

            <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
              <h3 style="color: #0066cc; margin-bottom: 10px;">Need Help? 🤝</h3>
              <p style="margin: 0; color: #666;">Our support team is here to help you. Contact us anytime!</p>
            </div>
          </div>

          <div class="footer">
            <div style="font-size: 20px; font-weight: bold; color: #667eea; margin-bottom: 10px;">Shopping App</div>
            <p>Happy Shopping! 🛍️</p>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
              This email was sent to ${user.email}. If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to Shopping App!
      
      Hi ${user.name},
      
      Thank you for joining Shopping App! We're excited to have you on board.
      
      What you can do with Shopping App:
      - Shop Quality Products: Browse thousands of electrical products
      - Save Favorites: Keep track of products you love
      - Track Orders: Get real-time updates on your orders
      - Fast Delivery: Quick and reliable delivery
      
      Start shopping now and discover amazing products!
      
      Need help? Our support team is here for you.
      
      Happy Shopping!
      Shopping App Team
    `
  })
};

// Send email function
const sendEmail = async (emailData) => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('⚠️ SendGrid API key not configured. Email not sent.');
      return { success: false, error: 'SendGrid not configured' };
    }

    const result = await sgMail.send(emailData);
    console.log('✅ Email sent successfully:', emailData.subject);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error('❌ Email send error:', error.response?.body || error.message);
    return { success: false, error: error.message };
  }
};

// Specific email functions
const sendOrderConfirmationEmail = async (order, user) => {
  if (!user.email) {
    console.warn('⚠️ User has no email address. Cannot send order confirmation.');
    return { success: false, error: 'No email address' };
  }

  const emailData = emailTemplates.orderPlaced(order, user);
  return await sendEmail(emailData);
};

const sendOrderStatusUpdateEmail = async (order, user, newStatus) => {
  if (!user.email) {
    console.warn('⚠️ User has no email address. Cannot send status update.');
    return { success: false, error: 'No email address' };
  }

  const emailData = emailTemplates.orderStatusUpdate(order, user, newStatus);
  return await sendEmail(emailData);
};

const sendWelcomeEmail = async (user) => {
  if (!user.email) {
    console.warn('⚠️ User has no email address. Cannot send welcome email.');
    return { success: false, error: 'No email address' };
  }

  const emailData = emailTemplates.welcomeEmail(user);
  return await sendEmail(emailData);
};

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendWelcomeEmail,
  emailTemplates
};