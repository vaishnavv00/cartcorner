const Product = require("../models/productModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbId");

const createProduct = asyncHandler(async (req, res) => {
  try {
    console.log("Received product creation request with body:", req.body);
    
    // Generate a unique slug
    const baseSlug = req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;
    
    // Check if slug exists and append number if needed
    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Handle images if they exist
    if (req.body.images) {
      console.log("Processing images:", req.body.images);
      
      // If images is a string, convert it to an array
      if (typeof req.body.images === 'string') {
        req.body.images = [req.body.images];
      }
      
      // Ensure images is an array and has the correct format
      if (Array.isArray(req.body.images)) {
        req.body.images = req.body.images.map(image => {
          console.log("Processing image:", image);
          
          // If image is already an object with url and public_id, return it as is
          if (typeof image === 'object' && image.url && image.public_id) {
            console.log("Image already in correct format:", image);
            return image;
          }
          
          // If image is a string (URL), extract public_id from it
          if (typeof image === 'string') {
            const public_id = image.split('/').pop().split('.')[0];
            console.log("Converting string URL to object:", { url: image, public_id });
            return {
              url: image,
              public_id: public_id
            };
          }

          // If image is invalid, return null
          console.warn('Invalid image format:', image);
          return null;
        }).filter(Boolean); // Remove any null values
      } else {
        console.warn("Images is not an array, setting to empty array");
        req.body.images = [];
      }
    }

    console.log("Creating product with data:", {
      ...req.body,
      slug,
      images: req.body.images
    });

    // Create the product with the unique slug
    const product = await Product.create({
      ...req.body,
      slug,
      images: req.body.images || []
    });

    console.log("Created product:", product);
    res.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      message: "Error creating product",
      error: error.message
    });
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }
    const updateProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updateProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deletedProduct = await Product.findByIdAndDelete(id);

    res.json(deletedProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const getaProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const findProduct = await Product.findById(id).populate("color");
    res.json(findProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const getAllProduct = asyncHandler(async (req, res) => {
  try {
    // Filtering
    const queryObj = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Product.find(JSON.parse(queryStr));

    // Sorting

    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // limiting the fields

    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }

    // pagination

    const page = req.query.page;
    const limit = req.query.limit;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
    if (req.query.page) {
      const productCount = await Product.countDocuments();
      if (skip >= productCount) throw new Error("This Page does not exists");
    }
    const product = await query;
    res.json(product);
  } catch (error) {
    throw new Error(error);
  }
});
const addToWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { prodId } = req.body;
  try {
    const user = await User.findById(_id);
    const alreadyadded = user.wishlist.find((id) => id.toString() === prodId);
    if (alreadyadded) {
      let user = await User.findByIdAndUpdate(
        _id,
        {
          $pull: { wishlist: prodId },
        },
        {
          new: true,
        }
      );
      res.json(user);
    } else {
      let user = await User.findByIdAndUpdate(
        _id,
        {
          $push: { wishlist: prodId },
        },
        {
          new: true,
        }
      );
      res.json(user);
    }
  } catch (error) {
    throw new Error(error);
  }
});

const rating = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { star, prodId, comment } = req.body;
  try {
    const product = await Product.findById(prodId);
    let alreadyRated = product.ratings.find(
      (userId) => userId.postedby.toString() === _id.toString()
    );
    if (alreadyRated) {
      const updateRating = await Product.updateOne(
        {
          ratings: { $elemMatch: alreadyRated },
        },
        {
          $set: { "ratings.$.star": star, "ratings.$.comment": comment },
        },
        {
          new: true,
        }
      );
    } else {
      const rateProduct = await Product.findByIdAndUpdate(
        prodId,
        {
          $push: {
            ratings: {
              star: star,
              comment: comment,
              postedby: _id,
            },
          },
        },
        {
          new: true,
        }
      );
    }
    const getallratings = await Product.findById(prodId);
    let totalRating = getallratings.ratings.length;
    let ratingsum = getallratings.ratings
      .map((item) => item.star)
      .reduce((prev, curr) => prev + curr, 0);
    let actualRating = Math.round(ratingsum / totalRating);
    let finalproduct = await Product.findByIdAndUpdate(
      prodId,
      {
        totalrating: actualRating,
      },
      { new: true }
    );
    res.json(finalproduct);
  } catch (error) {
    throw new Error(error);
  }
});

const bulkCreateProducts = asyncHandler(async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of products"
      });
    }

    console.log(`Received ${products.length} products for bulk creation`);
    
    const createdProducts = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      try {
        const productData = products[i];
        
        // Ensure required fields are present
        if (!productData.title || !productData.description || !productData.price) {
          errors.push({ index: i, error: "Missing required fields", product: productData.title || `Product ${i}` });
          continue;
        }

        // Handle slug generation
        if (!productData.slug) {
          productData.slug = productData.title
            .toLowerCase()
            .replace(/[^\w\s]/gi, "")
            .replace(/\s+/g, "-");
        }

        // Handle images if they exist
        if (productData.images) {
          if (typeof productData.images === "string") {
            productData.images = [{ url: productData.images, public_id: productData.images.split("/").pop() }];
          } else if (Array.isArray(productData.images) && typeof productData.images[0] === "string") {
            productData.images = productData.images.map(url => ({
              url,
              public_id: url.split("/").pop()
            }));
          }
        }

        const product = await Product.create(productData);
        createdProducts.push(product);
        console.log(`Created product ${i+1}/${products.length}: ${product.title}`);
      } catch (error) {
        console.error(`Error creating product at index ${i}:`, error);
        errors.push({ 
          index: i, 
          error: error.message,
          product: products[i].title || `Product ${i}`
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk upload completed. Created ${createdProducts.length} out of ${products.length} products`,
      createdCount: createdProducts.length,
      failedCount: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Error in bulk product creation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process bulk products",
      error: error.message
    });
  }
});

const getCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories);
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  createProduct,
  getaProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  addToWishlist,
  rating,
  bulkCreateProducts,
  getCategories,
};
