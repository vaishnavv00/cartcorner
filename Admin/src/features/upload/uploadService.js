import axios from "axios";
import { config } from "../../utils/axiosconfig";

export const uploadService = {
  uploadImg: async (data) => {
    try {
      console.log("Uploading image data:", data);
      let formData = data;
      
      // Check if data is already FormData
      if (!(data instanceof FormData)) {
        formData = new FormData();
        
        if (Array.isArray(data)) {
          // Handle array of files
          data.forEach(file => {
            formData.append("images", file);
          });
          console.log("Appended array of files to FormData");
        } else if (data instanceof File) {
          // Handle single file
          formData.append("images", data);
          console.log("Appended single file to FormData");
        } else {
          // Unknown data format
          console.error("Unsupported data format for upload:", data);
          throw new Error("Unsupported data format for upload");
        }
      } else {
        console.log("Data is already FormData");
      }
      
      const response = await axios.post(
        `${config.SERVER_URL}/api/upload/`, 
        formData,
        {
          headers: {
            ...config.headers,
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000 // 30 seconds timeout for large uploads
        }
      );
      
      console.log("Upload response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  deleteImg: async (id) => {
    try {
      console.log("Deleting image with ID:", id);
      const response = await axios.delete(
        `${config.SERVER_URL}/api/upload/delete-img/${id}`,
        {
          headers: config.headers,
        }
      );
      console.log("Delete response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Delete error:", error.response?.data || error.message);
      throw error;
    }
  },
};
