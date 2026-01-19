import express from "express";
import Product from "../Modules/product.js";
import protect from "../Middlewares/protect.js";
import authorizeRoles from "../Middlewares/authorizeRoles.js";
import upload from "../Middlewares/multer.js";
import cloudinary from '../config/cloudinary.js'

const productRouter = express.Router();

//get all elements
productRouter.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

//get specific element
productRouter.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product Not Found" });
  }

  res.status(200).json({ product });
});

//create product (admin access only)
productRouter.post(
  "/",
  protect,
  authorizeRoles(["admin"]),
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { name, description, sizes, prices, category, stock } = req.body;

      if (!name || !prices) {
        return res
          .status(400)
          .json({ message: "Please fill the essential fields (name, prices)" });
      }

      let imageURLs

      if(req.files && req.files.length > 0){
        const uploadPromises = req.files.map((file) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "Product" },
              (error, results) => {
                if(error){
                  reject(error)
                }
                else{
                  resolve(results.secure_url)
                }
              }
            )

            stream.end(file.buffer)
          })
        })

        imageURLs = await Promise.all(uploadPromises)
      }

      const product = new Product({
        name,
        description,
        sizes,
        prices,
        category,
        stock,
        ...(imageURLs && { images: imageURLs })
      });
      await product.save();

      res.status(201).json({
        _id: product.id,
        product: product,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

//update product (admin only)
productRouter.put(
  "/:id",
  protect,
  authorizeRoles(["admin"]),
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { name, description, sizes, prices, category, stock  } = req.body;
      let imageURLs

      if(req.files && req.files.length > 0){
        const uploadPromises = req.files.map((file) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "Product" },
              (error, results) => {
                if(error){
                  reject(error)
                }
                else{
                  resolve(results.secure_url)
                }
              }
            )

            stream.end(file.buffer)
          })
        })

        imageURLs = await Promise.all(uploadPromises)
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        { name, description, sizes, prices, category, stock, ...(imageURLs && { images: imageURLs }) },
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(404).json({ message: "Product Not Found" });
      }

      res.status(200).json({ message: "Product Updated", updatedProduct });
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })
;

//delete a product (admin only)
productRouter.delete('/:id', protect, authorizeRoles(['admin']), async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id)

    if(!deletedProduct){
      return res.status(404).json({ message: 'Product Not Found' })
    }

    res.status(200).json({ message: 'Product deleted', deletedProduct })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default productRouter;
