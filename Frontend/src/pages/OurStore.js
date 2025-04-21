import React, { useEffect, useState } from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import ProductCard from "../components/ProductCard";
import Container from "../components/Container";
import { useDispatch, useSelector } from "react-redux";
import { getAllProducts } from "../features/products/productSlilce";
import { useLocation, useNavigate } from "react-router-dom";

const OurStore = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [grid, setGrid] = useState(4);
  const productState = useSelector((state) => state?.product?.product);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productTags, setProductTags] = useState([]);

  //filter state
  const [tag, setTag] = useState(null);
  const [category, setCategory] = useState(null);
  const [brand, setBrand] = useState(null);
  const [minPrice, setminPrice] = useState(null);
  const [maxPrice, setmaxPrice] = useState(null);
  const [sort, setSort] = useState(null);

  const dispatch = useDispatch();

  // Get category from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get("category");
    if (categoryParam) {
      setCategory(categoryParam);
    }
  }, [location.search]);

  useEffect(() => {
    let newBrands = [];
    let newCategories = [];
    let newTags = [];

    for (let index = 0; index < productState?.length; index++) {
      const element = productState[index];
      newBrands.push(element.brand);
      newCategories.push(element.category);
      newTags.push(element.tags);
    }
    setBrands(newBrands);
    setCategories(newCategories);
    setProductTags(newTags);
  }, [productState]);

  useEffect(() => {
    dispatch(
      getAllProducts({ sort, tag, brand, category, minPrice, maxPrice })
    );
  }, [dispatch, sort, tag, brand, category, minPrice, maxPrice]);

  // Update URL when filter changes
  const updateCategoryFilter = (selectedCategory) => {
    setCategory(selectedCategory);
    
    // Update URL with the new category parameter or remove it if null
    if (selectedCategory) {
      navigate(`/product?category=${selectedCategory}`, { replace: true });
    } else {
      navigate("/product", { replace: true });
    }
  };

  return (
    <>
      <Meta title={"Our Store"} />
      <BreadCrumb title="Our Store" />
      <Container class1="store-wrapper home-wrapper-2 py-5">
        <div className="row">
          <div className="col-3">
            <div className="filter-card mb-3">
              <h3 className="filter-title">Shop By Categories</h3>
              <div>
                <ul className="ps-0">
                  <button
                    className="btn btn-link ps-0"
                    style={{ color: "var(--color-777777)", textDecoration: "none" }}
                    onClick={() => updateCategoryFilter(null)}
                  >
                    All
                  </button>

                  {categories &&
                    [...new Set(categories)].map((item, index) => (
                      <li 
                        key={index} 
                        onClick={() => updateCategoryFilter(item)}
                        className={category === item ? "active" : ""}
                        style={{ cursor: "pointer" }}
                      >
                        {item}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
            <div className="filter-card mb-3">
              <h3 className="filter-title">Filter By</h3>
              <div>
                <h5 className="sub-title">Price</h5>
                <div className="d-flex align-items-center gap-10">
                  <div className="form-floating">
                    <input
                      type="number"
                      className="form-control"
                      id="floatingInput"
                      placeholder="From"
                      onChange={(e) => setminPrice(e.target.value)}
                    />
                    <label htmlFor="floatingInput">From</label>
                  </div>
                  <div className="form-floating">
                    <input
                      type="number"
                      className="form-control"
                      id="floatingInput1"
                      placeholder="To"
                      onChange={(e) => setmaxPrice(e.target.value)}
                    />
                    <label htmlFor="floatingInput1">To</label>
                  </div>
                </div>
              </div>
              <div className="mt-4 mb-3">
                <h3 className="sub-title">Product Tags</h3>
                <div>
                  <div className="product-tags d-flex flex-wrap align-items-center gap-10">
                    {productTags &&
                      [...new Set(productTags)].map((item, index) => (
                        <span
                          key={index}
                          onClick={() => setTag(item)}
                          className="text-capitalize badge bg-light text-secondary rounded-3 py-2 px-3"
                          style={{ cursor: "pointer" }}
                        >
                          {item}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 mb-3">
                <h3 className="sub-title">Product Brands</h3>
                <div>
                  <div className="product-tags d-flex flex-wrap align-items-center gap-10">
                    {brands &&
                      [...new Set(brands)].map((item, index) => (
                        <span
                          key={index}
                          onClick={() => setBrand(item)}
                          className="text-capitalize badge bg-light text-secondary rounded-3 py-2 px-3"
                          style={{ cursor: "pointer" }}
                        >
                          {item}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-9">
            <div className="filter-sort-grid mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-10">
                  <p className="mb-0 d-block" style={{ width: "100px" }}>
                    Sort By:
                  </p>
                  <select
                    className="form-control form-select"
                    onChange={(e) => setSort(e.target.value)}
                    defaultValue="manual"
                  >
                    <option value="title">Alphabetically, A-Z</option>
                    <option value="-title">Alphabetically, Z-A</option>
                    <option value="price">Price, low to high</option>
                    <option value="-price">Price, high to low</option>
                    <option value="createdAt">Date, old to new</option>
                    <option value="-createdAt">Date, new to old</option>
                  </select>
                </div>
                <div className="d-flex align-items-center gap-10">
                  <p className="totalproducts mb-0">
                    {productState?.length} Products
                  </p>
                  <div className="d-flex gap-10 align-items-center grid">
                    <img
                      onClick={() => setGrid(3)}
                      src="images/gr4.svg"
                      className="d-block img-fluid"
                      alt="grid 4 columns"
                      style={{ cursor: "pointer" }}
                    />
                    <img
                      onClick={() => setGrid(4)}
                      src="images/gr3.svg"
                      className="d-block img-fluid"
                      alt="grid 3 columns"
                      style={{ cursor: "pointer" }}
                    />
                    <img
                      onClick={() => setGrid(6)}
                      src="images/gr2.svg"
                      className="d-block img-fluid"
                      alt="grid 2 columns"
                      style={{ cursor: "pointer" }}
                    />
                    <img
                      onClick={() => setGrid(12)}
                      src="images/gr.svg"
                      className="d-block img-fluid"
                      alt="grid 1 column"
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="products-list pb-5">
              <div className="d-flex gap-10 flex-wrap">
                <ProductCard
                  data={productState || []}
                  grid={grid}
                />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};

export default OurStore;
