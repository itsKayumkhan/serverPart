const express = require("express");
const {
  checkOut, verifyPayment,
} = require("../controllers/paymentController");
const router = express.Router();
const { isAuthenticatedUser } = require("../middleware/auth");

router.route("/payment/process").post(isAuthenticatedUser, checkOut);

router.route("/payment/key").get(isAuthenticatedUser, (req,res)=>res.status(200).json({success:true,key:process.env.RAZORPAY_KEY}));

router.route("/payment/verify").post(isAuthenticatedUser,verifyPayment )

module.exports = router;
