import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import Container from "../components/Container";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as yup from "yup";
import axios from "axios";
import { config } from "../utils/axiosConfig";
import {
  createAnOrder,
  deleteUserCart,
  getUserCart,
  resetState,
} from "../features/user/userSlice";
import { toast } from "react-toastify";

let shippingSchema = yup.object({
  firstname: yup.string().required("First Name is Required"),
  lastname: yup.string().required("Last Name is Required"),
  address: yup.string().required("Address Details are Required"),
  state: yup.string().required("State is Required"),
  city: yup.string().required("City is Required"),
  country: yup.string().required("Country is Required"),
  pincode: yup.number().required("Pincode is Required").positive().integer(),
});

// Add coupon validation schema
let couponSchema = yup.object().shape({
  coupon: yup.string().required("Coupon code is required"),
});

const Checkout = () => {
  const dispatch = useDispatch();
  const cartState = useSelector((state) => state?.auth?.cartProducts);
  const authState = useSelector((state) => state?.auth);
  const [totalAmount, setTotalAmount] = useState(null);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [paymentInfo, setPaymentInfo] = useState({
    razorpayPaymentId: "",
    razorpayOrderId: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    let sum = 0;
    for (let index = 0; index < cartState?.length; index++) {
      sum = sum + Number(cartState[index].quantity) * cartState[index].price;
      setTotalAmount(sum);
    }
  }, [cartState]);

  const getTokenFromLocalStorage = localStorage.getItem("customer")
    ? JSON.parse(localStorage.getItem("customer"))
    : null;

  const config2 = {
    headers: {
      Authorization: `Bearer ${
        getTokenFromLocalStorage !== null ? getTokenFromLocalStorage.token : ""
      }`,
      Accept: "application/json",
    },
  };

  useEffect(() => {
    dispatch(getUserCart(config2));
  }, [dispatch, config2]);

  useEffect(() => {
    if (
      authState?.orderedProduct?.order !== null &&
      authState?.orderedProduct?.success === true
    ) {
      navigate("/my-orders");
    }
  }, [authState, navigate]);

  const [cartProductState, setCartProductState] = useState([]);

  const formik = useFormik({
    initialValues: {
      firstname: "",
      lastname: "",
      address: "",
      state: "",
      city: "",
      country: "",
      pincode: "",
      other: "",
    },
    validationSchema: shippingSchema,
    onSubmit: (values) => {
      setShippingInfo(values);
      localStorage.setItem("address", JSON.stringify(values));
      setTimeout(() => {
        if (paymentMethod === "cod") {
          handleCashOnDelivery(values);
        } else {
          checkOutHandler();
        }
      }, 300);
    },
  });

  // Handle Cash on Delivery
  const handleCashOnDelivery = async (addressData) => {
    setIsLoading(true);
    try {
      // Calculate total with coupon if applied
      const totalWithDiscount = calculateTotal() - 100; // Subtract shipping cost
      
      // Create order directly with COD payment info
      const orderData = {
        totalPrice: totalAmount,
        totalPriceAfterDiscount: totalWithDiscount,
        orderItems: cartProductState,
        paymentInfo: {
          paymentMethod: "COD",
          status: "Not Paid",
          paymentId: `COD_${Date.now()}`,
        },
        shippingInfo: addressData,
        appliedCoupon: appliedCoupon ? {
          name: appliedCoupon.name,
          discount: appliedCoupon.discount
        } : null
      };

      dispatch(createAnOrder(orderData));
      dispatch(deleteUserCart(config2));
      localStorage.removeItem("address");
      dispatch(resetState());
      toast.success("Order placed successfully! Payment mode: Cash on Delivery");
      setTimeout(() => {
        navigate("/my-orders");
      }, 1500);
    } catch (error) {
      console.error("COD order creation error:", error);
      toast.error("Failed to create order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function for test payment
  const handleTestPayment = () => {
    setIsLoading(true);
    
    // Use minimal test data
    const testAddress = {
      firstname: "Test",
      lastname: "User",
      address: "123 Test St",
      city: "Test City",
      state: "Test State",
      country: "India",
      pincode: "123456"
    };
    
    // Save test address to localStorage
    localStorage.setItem("address", JSON.stringify(testAddress));
    
    // Call checkout handler
    setTimeout(() => {
      checkOutHandler();
    }, 300);
  };

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    let items = [];
    for (let index = 0; index < cartState?.length; index++) {
      items.push({
        product: cartState[index].productId._id,
        quantity: cartState[index].quantity,
        color: cartState[index].color._id,
        price: cartState[index].price,
      });
    }
    setCartProductState(items);
  }, [cartState]);

  // Online Payment Handler
  const checkOutHandler = async () => {
    setIsLoading(true);
    try {
      // Load Razorpay script
      console.log("Loading Razorpay script...");
      const res = await loadScript(
        "https://checkout.razorpay.com/v1/checkout.js"
      );

      if (!res) {
        console.error("Failed to load Razorpay SDK");
        toast.error("Razorpay SDK failed to load. Please try again later.");
        setIsLoading(false);
        return;
      }
      
      console.log("Razorpay script loaded successfully");

      // Calculate total with coupon if applied
      const totalWithDiscount = calculateTotal() - 100; // Subtract shipping cost
      
      // Create Razorpay order
      console.log("Creating checkout order for amount:", totalWithDiscount);
      const result = await axios.post(
        "http://localhost:5000/api/user/order/checkout",
        { amount: totalWithDiscount },
        config
      );

      console.log("Checkout API response:", result.data);

      if (!result || !result.data || !result.data.success) {
        console.error("Failed to create order:", result);
        toast.error("Failed to create payment order. Please try again.");
        setIsLoading(false);
        return;
      }

      const { amount, id: order_id, currency } = result.data.order;
      console.log("Order created successfully:", { amount, order_id, currency });

      // Configure Razorpay options
      const options = {
        key: "rzp_test_iut5hdbTYUv3iT", // Using the same key as backend for testing
        amount: amount,
        currency: currency,
        name: "Test Store",
        description: "Test Payment",
        order_id: order_id,
        handler: async function (response) {
          console.log("Payment success callback received:", response);
          try {
            const data = {
              orderCreationId: order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
            };
            
            console.log("Verifying payment with data:", data);

            // Verify payment
            const verificationResult = await axios.post(
              "http://localhost:5000/api/user/order/paymentVerification",
              data,
              config
            );

            console.log("Verification result:", verificationResult.data);

            if (verificationResult.data.success) {
              console.log("Payment verified successfully");
              // Create order with coupon info
              dispatch(
                createAnOrder({
                  totalPrice: totalAmount,
                  totalPriceAfterDiscount: totalWithDiscount,
                  orderItems: cartProductState,
                  paymentInfo: {
                    ...verificationResult.data,
                    paymentMethod: "Razorpay",
                    status: "Paid"
                  },
                  shippingInfo: JSON.parse(localStorage.getItem("address")),
                  appliedCoupon: appliedCoupon ? {
                    name: appliedCoupon.name,
                    discount: appliedCoupon.discount
                  } : null
                })
              );
              dispatch(deleteUserCart(config2));
              localStorage.removeItem("address");
              dispatch(resetState());
              toast.success("TEST PAYMENT SUCCESSFUL! Your order has been placed.");
              setTimeout(() => {
                navigate("/my-orders");
              }, 1500);
            } else {
              console.error("Payment verification failed:", verificationResult.data);
              toast.error("Payment verification failed. Please contact support.");
            }
          } catch (error) {
            console.error("Error during payment verification:", error);
            if (error.response) {
              console.error("Error response data:", error.response.data);
            }
            toast.error("Error processing payment. Please try again.");
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9999999999",
        },
        notes: {
          address: "Test Address"
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: function() {
            console.log("Payment modal dismissed");
            toast.info("Payment cancelled");
            setIsLoading(false);
          }
        }
      };

      console.log("Opening Razorpay with options:", options);
      // Open Razorpay
      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response){
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setIsLoading(false);
      });
      paymentObject.open();
    } catch (error) {
      console.error("Checkout process error:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
        toast.error(error.response.data.error || "Payment process failed. Please try again.");
      } else {
        toast.error("Payment process failed. Please try again.");
      }
      setIsLoading(false);
    }
  };

  // Add coupon application function
  const applyCoupon = async () => {
    if (!couponCode) {
      toast.error("Please enter a coupon code");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/user/order/apply-coupon",
        { coupon: couponCode },
        config
      );

      if (response.data.success) {
        setAppliedCoupon(response.data.coupon);
        toast.success("Coupon applied successfully!");
      } else {
        toast.error(response.data.error || "Invalid coupon code");
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      toast.error(error.response?.data?.error || "Failed to apply coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Calculate discounted total
  const calculateTotal = () => {
    let total = totalAmount || 0;
    if (appliedCoupon) {
      const discount = (total * appliedCoupon.discount) / 100;
      total = total - discount;
    }
    return total + 100; // Add shipping cost
  };

  return (
    <>
      <Container class1="checkout-wrapper py-5 home-wrapper-2">
        <div className="row">
          <div className="col-7">
            <div className="checkout-left-data">
              <h3 className="website-name">Cart Corner</h3>
              
              {/* Add Test Payment Button */}
              <div className="d-flex justify-content-end mb-3">
                <button 
                  type="button" 
                  className="btn btn-warning" 
                  onClick={handleTestPayment}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Test Payment Only"}
                </button>
              </div>
              
              <nav
                style={{ "--bs-breadcrumb-divider": ">" }}
                aria-label="breadcrumb"
              >
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link className="text-dark total-price" to="/cart">
                      Cart
                    </Link>
                  </li>
                  &nbsp; /&nbsp;
                  <li
                    className="breadcrumb-ite total-price active"
                    aria-current="page"
                  >
                    Information
                  </li>
                  &nbsp; /
                  <li className="breadcrumb-item total-price active">
                    Shipping
                  </li>
                  &nbsp; /
                  <li
                    className="breadcrumb-item total-price active"
                    aria-current="page"
                  >
                    Payment
                  </li>
                </ol>
              </nav>
              <h4 className="title total">Contact Information</h4>
              <p className="user-details total">
                {authState?.user?.firstname} {authState?.user?.lastname} ({authState?.user?.email})
              </p>
              <h4 className="mb-3">Shipping Address</h4>
              <form
                onSubmit={formik.handleSubmit}
                action=""
                className="d-flex gap-15 flex-wrap justify-content-between"
              >
                <div className="w-100">
                  <select
                    className="form-control form-select"
                    id=""
                    name="country"
                    value={formik.values.country}
                    onChange={formik.handleChange("country")}
                    onBlur={formik.handleChange("country")}
                  >
                    <option value="" selected disabled>
                      Select Country
                    </option>
                    <option value="India">India</option>
                  </select>
                  <div className="error ms-2 my-1">
                    {formik.touched.country && formik.errors.country}
                  </div>
                </div>
                <div className="flex-grow-1">
                  <input
                    type="text"
                    placeholder="First Name"
                    className="form-control"
                    name="firstname"
                    value={formik.values.firstname}
                    onChange={formik.handleChange("firstname")}
                    onBlur={formik.handleBlur("firstname")}
                  />
                  <div className="error ms-2 my-1">
                    {formik.touched.firstname && formik.errors.firstname}
                  </div>
                </div>
                <div className="flex-grow-1">
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="form-control"
                    name="lastname"
                    value={formik.values.lastname}
                    onChange={formik.handleChange("lastname")}
                    onBlur={formik.handleBlur("lastname")}
                  />
                  <div className="error ms-2 my-1">
                    {formik.touched.lastname && formik.errors.lastname}
                  </div>
                </div>
                <div className="w-100">
                  <input
                    type="text"
                    placeholder="Address"
                    className="form-control"
                    name="address"
                    value={formik.values.address}
                    onChange={formik.handleChange("address")}
                    onBlur={formik.handleBlur("address")}
                  />
                  <div className="error ms-2 my-1">
                    {formik.touched.address && formik.errors.address}
                  </div>
                </div>
                <div className="w-100">
                  <input
                    type="text"
                    placeholder="Apartment, Suite ,etc"
                    className="form-control"
                    name="other"
                    value={formik.values.other}
                    onChange={formik.handleChange("other")}
                    onBlur={formik.handleBlur("other")}
                  />
                </div>
                <div className="flex-grow-1">
                  <input
                    type="text"
                    placeholder="City"
                    className="form-control"
                    name="city"
                    value={formik.values.city}
                    onChange={formik.handleChange("city")}
                    onBlur={formik.handleBlur("city")}
                  />
                  <div className="error ms-2 my-1">
                    {formik.touched.city && formik.errors.city}
                  </div>
                </div>
                <div className="flex-grow-1">
                  <select
                    className="form-control form-select"
                    id=""
                    name="state"
                    value={formik.values.state}
                    onChange={formik.handleChange("state")}
                    onBlur={formik.handleChange("state")}
                  >
                    <option value="" selected disabled>
                      Select State
                    </option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                    <option value="Assam">Assam</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Chhattisgarh">Chhattisgarh</option>
                    <option value="Goa">Goa</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Manipur">Manipur</option>
                    <option value="Meghalaya">Meghalaya</option>
                    <option value="Mizoram">Mizoram</option>
                    <option value="Nagaland">Nagaland</option>
                    <option value="Odisha">Odisha</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Sikkim">Sikkim</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Tripura">Tripura</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Lakshadweep">Lakshadweep</option>
                    <option value="Puducherry">Puducherry</option>
                  </select>
                  <div className="error ms-2 my-1">
                    {formik.touched.state && formik.errors.state}
                  </div>
                </div>
                <div className="flex-grow-1">
                  <input
                    type="text"
                    placeholder="Pincode"
                    className="form-control"
                    name="pincode"
                    value={formik.values.pincode}
                    onChange={formik.handleChange("pincode")}
                    onBlur={formik.handleBlur("pincode")}
                  />
                  <div className="error ms-2 my-1">
                    {formik.touched.pincode && formik.errors.pincode}
                  </div>
                </div>
                
                {/* Add Coupon Section before Payment Method */}
                <div className="w-100 mt-3">
                  <h4 className="mb-3">Apply Coupon</h4>
                  <div className="d-flex gap-2 mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={!!appliedCoupon}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={applyCoupon}
                      disabled={isApplyingCoupon || !!appliedCoupon}
                    >
                      {isApplyingCoupon ? "Applying..." : "Apply"}
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="alert alert-success">
                      Coupon "{appliedCoupon.name}" applied! {appliedCoupon.discount}% off
                    </div>
                  )}
                </div>
                
                {/* Payment Method Selection */}
                <div className="w-100 mt-3">
                  <h4 className="mb-3">Payment Method</h4>
                  <div className="d-flex gap-3 mb-3">
                    <div className="form-check">
                      <input
                        type="radio"
                        className="form-check-input"
                        id="razorpay"
                        name="paymentMethod"
                        value="razorpay"
                        checked={paymentMethod === "razorpay"}
                        onChange={() => setPaymentMethod("razorpay")}
                      />
                      <label className="form-check-label" htmlFor="razorpay">
                        Online Payment (Razorpay)
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        type="radio"
                        className="form-check-input"
                        id="cod"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                      />
                      <label className="form-check-label" htmlFor="cod">
                        Cash on Delivery
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="w-100">
                  <div className="d-flex justify-content-between align-items-center">
                    <Link to="/cart" className="text-dark">
                      <BiArrowBack className="me-2" />
                      Return to Cart
                    </Link>
                    <button className="button" type="submit" disabled={isLoading}>
                      {isLoading ? "Processing..." : paymentMethod === "cod" ? "Place COD Order" : "Proceed to Payment"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="col-5">
            <div className="border-bottom py-4">
              {cartState &&
                cartState?.map((item, index) => {
                  return (
                    <div
                      key={index}
                      className="d-flex gap-10 mb-2 align-align-items-center"
                    >
                      <div className="w-75 d-flex gap-10">
                        <div className="w-25 position-relative">
                          <span
                            style={{ top: "-10px", right: "2px" }}
                            className="badge bg-secondary text-white rounded-circle p-2 position-absolute"
                          >
                            {item?.quantity}
                          </span>
                          <img
                            src={item?.productId?.images[0]?.url}
                            width={100}
                            height={100}
                            alt="product"
                          />
                        </div>
                        <div>
                          <h5 className="total-price">
                            {item?.productId?.title}
                          </h5>
                          <p className="total-price">{item?.color?.title}</p>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h5 className="total">
                          Rs. {item?.price * item?.quantity}
                        </h5>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="border-bottom py-4">
              <div className="d-flex justify-content-between align-items-center">
                <p className="total">Subtotal</p>
                <p className="total-price">
                  Rs. {totalAmount ? totalAmount : "0"}
                </p>
              </div>
              {appliedCoupon && (
                <div className="d-flex justify-content-between align-items-center">
                  <p className="total">Discount ({appliedCoupon.discount}%)</p>
                  <p className="total-price text-success">
                    - Rs. {((totalAmount * appliedCoupon.discount) / 100).toFixed(2)}
                  </p>
                </div>
              )}
              <div className="d-flex justify-content-between align-items-center">
                <p className="mb-0 total">Shipping</p>
                <p className="mb-0 total-price">Rs. 100</p>
              </div>
            </div>
            <div className="d-flex justify-content-between align-items-center border-bootom py-4">
              <h4 className="total">Total</h4>
              <h5 className="total-price">
                Rs. {calculateTotal().toFixed(2)}
              </h5>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};

export default Checkout;
