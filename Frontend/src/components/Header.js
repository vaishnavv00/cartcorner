import React, { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { BsSearch } from "react-icons/bs";
import { BsHeadset } from "react-icons/bs";
import compare from "../images/compare.svg";
import wishlist from "../images/wishlist.svg";
import user from "../images/user.svg";
import cart from "../images/cart.svg";
import menu from "../images/menu.svg";
import { useDispatch, useSelector } from "react-redux";
import { Typeahead } from "react-bootstrap-typeahead";
import "react-bootstrap-typeahead/css/Typeahead.css";
import { getAProduct, getCategories } from "../features/products/productSlilce";
import { getUserCart } from "../features/user/userSlice";

const Header = () => {
  const dispatch = useDispatch();
  const cartState = useSelector((state) => state?.auth?.cartProducts);
  const authState = useSelector((state) => state?.auth);
  const [total, setTotal] = useState(null);
  const [paginate, setPaginate] = useState(true);
  const productState = useSelector((state) => state?.product?.product);
  const categoryState = useSelector((state) => state?.product?.categories);
  const navigate = useNavigate();

  // Initialize Bootstrap dropdown
  useEffect(() => {
    // Check if window and bootstrap are defined
    if (typeof window !== 'undefined' && window.bootstrap) {
      // Initialize all dropdowns
      const dropdownElementList = document.querySelectorAll('.dropdown-toggle');
      dropdownElementList.forEach(dropdownToggleEl => {
        new window.bootstrap.Dropdown(dropdownToggleEl);
      });
    }
  }, []);
  
  // Fetch categories for dropdown
  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

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
  }, []);

  const [productOpt, setProductOpt] = useState([]);
  useEffect(() => {
    let sum = 0;
    for (let index = 0; index < cartState?.length; index++) {
      sum = sum + Number(cartState[index].quantity) * cartState[index].price;
      setTotal(sum);
    }
  }, [cartState]);

  useEffect(() => {
    let data = [];
    for (let index = 0; index < productState?.length; index++) {
      const element = productState[index];
      data.push({ id: index, prod: element?._id, name: element?.title });
    }
    setProductOpt(data);
  }, [productState]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };
  
  const handleCategoryClick = (category) => {
    navigate(`/product?category=${encodeURIComponent(category)}`);
  };
  
  return (
    <>
      <header className="header-top-strip py-3">
        <div className="container-xxl">
          <div className="row">
            <div className="col-12">
              <div className="d-flex justify-content-end">
                <div className="dropdown">
                  <button
                    className="btn btn-secondary dropdown-toggle bg-transparent border-0 text-white d-flex align-items-center gap-2 customer-support-btn"
                    type="button"
                    id="customerSupportDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <BsHeadset className="fs-5" />
                    Customer Support
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end customer-support-dropdown" aria-labelledby="customerSupportDropdown">
                    <li>
                      <a className="dropdown-item customer-support-item" href="tel:+91 9581408223">
                        <i className="bi bi-telephone-fill me-2"></i> +91 9581408223
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item customer-support-item" href="mailto:saivaishnav2003@gmail.com">
                        <i className="bi bi-envelope-fill me-2"></i> saivaishnav2003@gmail.com
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <style>
        {`
          .customer-support-btn:hover {
            background-color: rgba(255, 255, 255, 0.1) !important;
            transform: translateY(-1px);
            transition: all 0.3s ease;
          }
          
          .customer-support-dropdown {
            background-color: #fff;
            border: none;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            padding: 8px 0;
          }
          
          .customer-support-item {
            padding: 8px 16px;
            transition: all 0.3s ease;
          }
          
          .customer-support-item:hover {
            background-color: #f8f9fa;
            color: #8E1616;
            transform: translateX(5px);
          }
          
          .customer-support-item i {
            color: #8E1616;
          }
        `}
      </style>
      <header className="header-upper py-3">
        <div className="container-xxl">
          <div className="row align-items-center">
            <div className="col-2">
              <h2>
                <Link className="text-white" to="/ ">
                  Cart Corner
                </Link>
              </h2>
            </div>
            <div className="col-5">
              <div className="input-group">
                <Typeahead
                  id="pagination-example"
                  onPaginate={() => console.log("Results paginated")}
                  onChange={(selected) => {
                    navigate(`/product/${selected[0]?.prod}`);
                    dispatch(getAProduct(selected[0]?.prod));
                  }}
                  options={productOpt}
                  paginate={paginate}
                  labelKey={"name"}
                  placeholder="Search for Products here"
                />
                <span className="input-group-text p-3" id="basic-addon2">
                  <BsSearch className="fs-6" />
                </span>
              </div>
            </div>
            <div className="col-5">
              <div className="header-upper-links d-flex align-items-center justify-content-between">
                <div>
                  {/* <Link
                    to="/compare-product"
                    className="d-flex align-items-center gap-10 text-white"
                  >
                    <img src={compare} alt="compare" />
                    <p className="mb-0">
                      Compare <br /> Products
                    </p>
                  </Link> */}
                </div>
                <div>
                  <Link
                    to="/wishlist"
                    className="d-flex align-items-center gap-10 text-white"
                  >
                    <img src={wishlist} alt="wishlist" />
                    <p className="mb-0">
                      Favourite <br /> wishlist
                    </p>
                  </Link>
                </div>
                <div>
                  <Link
                    to={authState?.user === null ? "/login" : "my-profile"}
                    className="d-flex align-items-center gap-10 text-white"
                  >
                    <img src={user} alt="user" />
                    {authState?.user === null ? (
                      <p className="mb-0">
                        Log in <br /> My Account
                      </p>
                    ) : (
                      <p className="mb-0">
                        Welcome {authState?.user?.firstname}
                      </p>
                    )}
                  </Link>
                </div>
                <div>
                  <Link
                    to="/cart"
                    className="d-flex align-items-center gap-10 text-white"
                  >
                    <img src={cart} alt="cart" />
                    <div className="d-flex flex-column gap-10">
                      <span className="badge bg-white text-dark">
                        {cartState?.length ? cartState?.length : 0}
                      </span>
                      <p className="mb-0">
                        Rs. {!cartState?.length ? 0 : total ? total : 0}
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <header className="header-bottom py-3">
        <div className="container-xxl">
          <div className="row">
            <div className="col-12">
              <div className="menu-bottom d-flex align-items-center gap-30">
                <div>
                  <div className="dropdown">
                    <button
                      className="btn btn-secondary dropdown-toggle bg-transparent border-0 gap-15 d-flex align-items-center"
                      type="button"
                      id="dropdownMenuButton1"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <img src={menu} alt="" />
                      <span className="me-5 d-inline-block">
                        Shop Categories
                      </span>
                    </button>
                    <ul
                      className="dropdown-menu"
                      aria-labelledby="dropdownMenuButton1"
                    >
                      {categoryState && categoryState.length > 0 ? (
                        categoryState.map((category, index) => (
                          <li key={index}>
                            <Link 
                              className="dropdown-item text-white" 
                              to={`/product?category=${encodeURIComponent(category)}`}
                              onClick={(e) => {
                                e.preventDefault();
                                handleCategoryClick(category);
                              }}
                            >
                              {category}
                            </Link>
                          </li>
                        ))
                      ) : (
                        <li><span className="dropdown-item text-white">No categories found</span></li>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="menu-links">
                  <div className="d-flex align-items-center gap-15">
                    <NavLink to="/">Home</NavLink>
                    <NavLink to="/product">Our Store</NavLink>
                    <NavLink to="/my-orders">My Orders</NavLink>
                    {authState?.user !== null ? (
                      <button
                        className="border border-0 bg-trasparent text-white text-uppercase"
                        
                        type="button"
                        style={{ backgroundColor: "#8E1616" }}
                        onClick={handleLogout}
                      >
                        LogOut
                      </button>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
