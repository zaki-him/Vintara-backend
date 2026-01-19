import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_CONFIG}`)
    console.log('DATABASE CONNECTED SUCCESSFULLY')
  } catch (error) {
    console.error('FAILED TO CONNECT TO THE DATABASE\n', error)
    process.exit(1)
  }
}

export default connectDB