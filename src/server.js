import express from "express";
import dotenv from "dotenv";
import cors from 'cors'
import connectDB from "./config/db.js";
import authRouter from "./Routers/authRouter.js";
import userRouter from "./Routers/userRouter.js";
import productRouter from "./Routers/productRouter.js";
import cartRouter from "./Routers/cartRouter.js";
import orderRouter from "./Routers/orderRouter.js";
import checkoutRouter from "./Routers/checkoutRouter.js";
import webhookRouter from "./Routers/webhookRouter.js";

dotenv.config();

const server = express();

server.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))

server.use('/webhook', webhookRouter)
server.use(express.json())

server.use('/auth', authRouter)
server.use('/users', userRouter)
server.use('/products', productRouter)
server.use('/cart', cartRouter)
server.use('/orders', orderRouter)
server.use('/checkout', checkoutRouter)

connectDB().then(() => {
  server.listen(3000, () => {
    console.log("Server is listening");
  });
});
