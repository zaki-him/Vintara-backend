import express from 'express'
import protect from '../Middlewares/protect.js'
import Order from '../Modules/order.js'
import Cart from '../Modules/cart.js'

const orderRouter = express.Router()

//get user orders
orderRouter.get('/', protect, async (req, res) => {
  try {
    const orders =  await Order.findOne({ user: req.user.id }).populate("items.product")
    res.status(200).json(orders)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

orderRouter.post('/', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product")

    if(!cart){
      return res.status(400).json({ message: "Empty Cart" })
    }

    const totalPrice = cart.items.reduce((acc, item) => acc + item.product.price * item.quantity , 0)

    const order = new Order({
      user: req.user.id,
      items: cart.items.map(item => ({ product: item.product._id, quantity: item.quantity })),
      totalPrice,
      shippingAddress: req.body.shippingAddress
    })

    await order.save()
    await cart.deleteOne({ user: req.user.id })

    res.status(201).json({ message: "Order created", order })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default orderRouter