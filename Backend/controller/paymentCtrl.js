const Razorpay = require("razorpay");
const crypto = require("crypto");

// Using test keys directly for simplicity in testing
const key_id = "rzp_test_iut5hdbTYUv3iT";
const key_secret = "mkQDxP5hudsdSqFjvmeBIrPY";

// Create Razorpay instance
const instance = new Razorpay({
  key_id: key_id,
  key_secret: key_secret,
});

const checkout = async (req, res) => {
  try {
    console.log("Received checkout request with body:", req.body);
    const { amount } = req.body;
    
    if (!amount) {
      console.error("Missing amount in request");
      return res.status(400).json({
        success: false,
        error: "Amount is required",
      });
    }

    // Ensure amount is a number and convert to integer (Razorpay requirement)
    const amountInPaise = Math.round(Number(amount) * 100);
    
    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      console.error("Invalid amount:", amount);
      return res.status(400).json({
        success: false,
        error: "Invalid amount provided",
      });
    }

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `test_receipt_${Date.now()}`,
    };
    
    console.log("Creating Razorpay order with options:", options);
    
    try {
      const order = await instance.orders.create(options);
      console.log("Order created successfully:", order);
      
      return res.json({
        success: true,
        order,
      });
    } catch (orderError) {
      console.error("Error creating Razorpay order:", orderError);
      return res.status(500).json({
        success: false,
        error: orderError.message || "Failed to create Razorpay order",
      });
    }
  } catch (error) {
    console.error("Unexpected error in checkout:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred",
    });
  }
};

const paymentVerification = async (req, res) => {
  try {
    console.log("Received payment verification request with body:", req.body);
    const { razorpayOrderId, razorpayPaymentId } = req.body;
    
    if (!razorpayOrderId || !razorpayPaymentId) {
      console.error("Missing required payment details");
      return res.status(400).json({
        success: false,
        error: "Payment details are missing",
      });
    }
    
    console.log("Verifying payment ID:", razorpayPaymentId, "for order ID:", razorpayOrderId);
    
    try {
      // For testing, we can simply verify that the payment ID exists
      const payment = await instance.payments.fetch(razorpayPaymentId);
      console.log("Payment details retrieved:", payment);
      
      // Simple success response for testing
      return res.json({
        success: true,
        razorpayOrderId,
        razorpayPaymentId,
        status: payment.status || "captured" // Default to captured for testing
      });
    } catch (fetchError) {
      console.error("Error fetching payment details:", fetchError);
      return res.status(400).json({
        success: false,
        error: "Payment verification failed: " + fetchError.message,
      });
    }
  } catch (error) {
    console.error("Unexpected error in payment verification:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred during verification",
    });
  }
};

module.exports = {
  checkout,
  paymentVerification,
};
