const cloudinary = require("cloudinary").v2;

// Ensure environment variables are loaded
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_SECRET_KEY) {
  console.error("Cloudinary configuration is missing. Please check your environment variables.");
  process.exit(1);
}

console.log("Cloudinary Config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY ? "***" : undefined
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
  api_key: process.env.CLOUDINARY_API_KEY.trim(),
  api_secret: process.env.CLOUDINARY_SECRET_KEY.trim(),
});

const cloudinaryUploadImg = async (fileToUploads, folder) => {
  console.log("Starting Cloudinary upload:", { fileToUploads, folder });
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(fileToUploads, {
      folder: folder,
      resource_type: "auto"
    }, (error, result) => {
      if (error) {
        console.error("Cloudinary upload error:", error);
        reject(error);
        return;
      }
      console.log("Cloudinary upload successful:", result);
      resolve({
        url: result.secure_url,
        asset_id: result.asset_id,
        public_id: result.public_id,
      });
    });
  });
};

const cloudinaryDeleteImg = async (fileToDelete) => {
  console.log("Starting Cloudinary delete:", { fileToDelete });
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(fileToDelete, (error, result) => {
      if (error) {
        console.error("Cloudinary delete error:", error);
        reject(error);
        return;
      }
      console.log("Cloudinary delete successful:", result);
      resolve({
        url: result.secure_url,
        asset_id: result.asset_id,
        public_id: result.public_id,
      });
    });
  });
};

module.exports = { cloudinaryUploadImg, cloudinaryDeleteImg };
