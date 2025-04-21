const express = require("express");
const {
  createProduct,
  getaProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  addToWishlist,
  rating,
  bulkCreateProducts,
  getCategories,
} = require("../controller/productCtrl");
const { isAdmin, authMiddleware } = require("../middlewares/authMiddleware");
const { upload, productImgResize } = require("../middlewares/uploadImage");

const router = express.Router();

router.put("/rating", authMiddleware, rating);

router.put("/wishlist", authMiddleware, addToWishlist);

router.get("/categories", getCategories);

router.post("/", authMiddleware, isAdmin, upload.array("images", 5), productImgResize, createProduct);

router.get("/", getAllProduct);

router.get("/:id", getaProduct);

router.put("/:id", authMiddleware, isAdmin, upload.array("images", 5), productImgResize, updateProduct);

router.delete("/:id", authMiddleware, isAdmin, deleteProduct);

router.post(
  "/bulk-create",
  authMiddleware,
  isAdmin,
  bulkCreateProducts
);

module.exports = router;
