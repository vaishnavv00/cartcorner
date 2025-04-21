const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { cloudinaryUploadImg } = require("../utils/cloudinary");

// Create necessary directories if they don't exist
const uploadDir = path.join(__dirname, "../public/images");
const productsDir = path.join(uploadDir, "products");

[uploadDir, productsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("Multer destination:", uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    console.log("Multer filename:", `images-${uniqueSuffix}${path.extname(file.originalname)}`);
    cb(null, `images-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Please upload only images"), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const productImgResize = async (req, res, next) => {
  if (!req.files) return next();
  console.log("Starting productImgResize");
  console.log("Processing files:", req.files.map(f => f.filename));
  
  try {
    const uploadPromises = req.files.map(async (file) => {
      const filePath = path.join(uploadDir, file.filename);
      const resizedPath = path.join(productsDir, file.filename);
      
      console.log("Resizing image:", {
        filePath,
        resizedPath
      });

      await sharp(filePath)
        .resize(300, 300, {
          fit: "cover",
          position: "center",
        })
        .toFile(resizedPath);

      console.log("Image resized successfully");

      // Upload to Cloudinary
      console.log("Starting Cloudinary upload for:", resizedPath);
      const uploadResult = await cloudinaryUploadImg(resizedPath, "products");
      console.log("Cloudinary upload successful:", uploadResult);

      // Clean up temporary files after successful upload
      fs.unlinkSync(filePath);
      fs.unlinkSync(resizedPath);
      console.log("Temporary files cleaned up");

      return {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url || uploadResult.url
      };
    });

    const uploadResults = await Promise.all(uploadPromises);
    console.log("All images processed, URLs:", uploadResults.map(r => r.url));
    
    req.body.images = uploadResults;
    next();
  } catch (error) {
    console.error("Error in productImgResize:", error);
    next(error);
  }
};

module.exports = { upload, productImgResize };
