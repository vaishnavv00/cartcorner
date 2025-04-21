const express = require("express");
const { uploadImages, deleteImages } = require("../controller/uploadCtrl");
const { isAdmin, authMiddleware } = require("../middlewares/authMiddleware");
const { upload, productImgResize } = require("../middlewares/uploadImage");
const router = express.Router();

// Direct upload route without resize middleware
router.post(
  "/",
  authMiddleware,
  isAdmin,
  upload.array("images", 10),
  uploadImages
);

// Product image upload with resize middleware
router.post(
  "/product",
  authMiddleware,
  isAdmin,
  upload.array("images", 10),
  productImgResize,
  uploadImages
);

router.delete("/delete-img/:id", authMiddleware, isAdmin, deleteImages);

module.exports = router;
