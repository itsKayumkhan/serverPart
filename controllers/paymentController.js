const Razorpay = require('razorpay');
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});
const ErrorHandler = require('../utils/errorhander'); 
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const Order = require('../models/orderModel');

exports.checkOut = catchAsyncErrors(async (req, res) => {
  const { amount, currency, shippingInfo, orderItems, userId ,shippingPrice,itemsPrice} = req.body;

  // Create a new order
  const orderOptions = {
    amount: amount * 100, // Convert to smallest currency unit
    currency: currency || 'INR',
  };

 
    const order = await instance.orders.create(orderOptions);
    // Save the order details in your database
    const newOrder = new Order({
      shippingInfo: shippingInfo,
      orderItems: orderItems,
      user: userId, // Assuming userId is provided in the request body
      paymentInfo: {
        razorpayPaymentId: '', // Initialize with empty values
        razorpayOrderId: order.id,
        razorpaySignature: '',
        status: 'pending', // Initialize with a default status
      },
      paidAt: null, // Initialize with null
      itemsPrice, // Initialize with 0 or adjust based on your logic
      taxPrice: 0, // Initialize with 0 or adjust based on your logic
      shippingPrice: shippingPrice, // Initialize with 0 or adjust based on your logic
      totalPrice: amount, // Assuming amount is the total price
      orderStatus: 'Processing',
      deliveredAt: null, // Initialize with null
    });

    await newOrder.save();

    res.status(200).json({ success: true, order });
 
});

exports.verifyPayment = catchAsyncErrors(async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

    const response = await instance.payments.fetch(paymentId);

    // Verify the payment signature
    const crypto = require('crypto');
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET);
    shasum.update(`${orderId}|${paymentId}`);

    if (shasum.digest('hex') === signature) {
      // Payment verification successful

      // Update the order in the database with Razorpay payment information
      const updatedOrder = await Order.findOneAndUpdate(
        { 'paymentInfo.razorpayOrderId': orderId },
        {
          $set: {
            'paymentInfo.razorpayPaymentId': paymentId,
            'paymentInfo.razorpaySignature': signature,
            'paymentInfo.status': 'success',
            paidAt: new Date(),
            // You may also need to update other fields based on your application's logic
          },
        },
        { new: true }
      );

      if (!updatedOrder) {
        // Handle the case where the order is not found
        console.log('Order not found');
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      console.log('Payment verification successful');
      res.json({ success: true });
    } else {
      // Payment verification failed
      console.log('Payment verification failed');
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
});
