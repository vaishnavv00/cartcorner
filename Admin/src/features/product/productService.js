import axios from "axios";
import { config } from "../../utils/axiosconfig";

export const productService = {
  getProducts: async () => {
    const response = await axios.get(`${config.SERVER_URL}/api/product/`);
    return response.data;
  },
  createProduct: async (productData) => {
    const response = await axios.post(`${config.SERVER_URL}/api/product/`, productData, {
      headers: config.headers,
    });
    return response.data;
  },
  getProduct: async (id) => {
    const response = await axios.get(`${config.SERVER_URL}/api/product/${id}`);
    return response.data;
  },
  updateProduct: async (productData) => {
    const response = await axios.put(
      `${config.SERVER_URL}/api/product/${productData.id}`,
      productData,
      {
        headers: config.headers,
      }
    );
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await axios.delete(`${config.SERVER_URL}/api/product/${id}`, {
      headers: config.headers,
    });
    return response.data;
  },
  bulkCreateProducts: async (productsData) => {
    const response = await axios.post(
      `${config.SERVER_URL}/api/product/bulk-create`,
      { products: productsData },
      {
        headers: config.headers,
      }
    );
    return response.data;
  },
};
