import mongoose from "mongoose";
import hashPassword from "../Middlewares/hashPassword.js";
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ],
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    min: [8, 'Password must be at least 8 characters long'],
    max: [128, 'Password cannot exceed 128 characters'],
    // Don't select the password field by default
    select: false
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['user', 'admin'],
      message: 'Role must be either user or admin'
    },
    default: 'user'
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
    minlength: [10, 'Address must be at least 10 characters'],
    maxlength: [200, 'Address cannot exceed 200 characters']
  }
},{
  timestamps: true
})

userSchema.pre("save", hashPassword)

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password)
}

const User = mongoose.model("User", userSchema)

export default User