import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name:{
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [3, 'Product name must be at least 3 characters'],
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },

  description:{
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  sizes: {
    type: [String],
    // Validate that sizes are from allowed list
    validate: {
      validator: function(v) {
        const allowedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        return v.every(size => allowedSizes.includes(size))
      },
      message: 'Size must be one of: XS, S, M, L, XL, XXL'
    }
  },

  prices: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0.01, 'Price must be greater than 0'],
    // Ensure max 2 decimal places (cents)
    validate: {
      validator: function(v) {
        return (v * 100) % 1 === 0  // Check if price has max 2 decimal places
      },
      message: 'Price must have maximum 2 decimal places'
    }
  },

  category: {
    type: String,
    trim: true,
    enum: {
      values: ['Clothing', 'Shoes', 'Accessories', 'Bags'],
      message: 'Category must be one of: Clothing, Shoes, Accessories, Bags'
    }
  },

  stock: {
    type: Number,
    default: 1,
    min: [0, 'Stock cannot be negative'],
    // Ensure stock is an integer
    validate: {
      validator: Number.isInteger,
      message: 'Stock must be a whole number'
    }
  },

  images: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length <= 5  // Max 5 images
      },
      message: 'Product can have maximum 5 images'
    }
  }
}, {
  timestamps: true
})

const Product = mongoose.model("Product", productSchema)

export default Product