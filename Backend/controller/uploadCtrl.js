const fs = require("fs");
const asyncHandler = require("express-async-handler");
const { cloudinaryUploadImg } = require("../utils/cloudinary");
const cloudinary = require("cloudinary").v2;

const uploadImages = asyncHandler(async (req, res) => {
  try {
    console.log("Upload request received with files:", req.files?.map(f => f.filename));
    
    // Check if images were already processed by middleware
    if (req.body.images && req.body.images.length > 0) {
      console.log("Images already processed by middleware:", req.body.images);
      return res.json(req.body.images);
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "No files uploaded",
        success: false
      });
    }

    const urls = [];
    for (const file of req.files) {
      const filePath = file.path;
      console.log("Processing file:", filePath);
      
      // Check if file exists before trying to upload
      if (!fs.existsSync(filePath)) {
        console.log(`File not found at ${filePath}, it may have been processed already`);
        continue;
      }
      
      try {
        const newpath = await cloudinaryUploadImg(filePath, "images");
        console.log("Cloudinary upload result:", newpath);
        
        urls.push({
          public_id: newpath.public_id,
          url: newpath.url
        });
        
        console.log("Added to urls array:", urls[urls.length - 1]);
        
        // Clean up local file after successful upload
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file ${filePath}`);
        }
      } catch (uploadError) {
        console.error("Error uploading file to Cloudinary:", uploadError);
        // Continue with other files even if one fails
      }
    }

    if (urls.length === 0) {
      return res.status(500).json({
        message: "Failed to upload any images",
        success: false
      });
    }

    console.log("Sending response with urls:", urls);
    res.json(urls);
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).json({
      message: "Error uploading images",
      error: error.message,
      success: false
    });
  }
});

const deleteImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    console.log("Deleting image from Cloudinary:", id);
    const result = await cloudinary.uploader.destroy(id);
    console.log("Delete successful:", result);
    res.json({ 
      message: "Image deleted successfully", 
      success: true,
      public_id: id
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to delete image",
      error: error.message,
      success: false
    });
  }
});

module.exports = {
  uploadImages,
  deleteImages,
};
