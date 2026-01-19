import express from 'express'
import Stripe from 'stripe'
import protect from '../Middlewares/protect.js'
import Cart from '../Modules/cart.js'
import dotenv from 'dotenv'

dotenv.config()

const checkoutRouter = express.Router()
const stripe = new Stripe(process.env.STRIPE_API_SECRET_KEY) // connect with Stripe

checkoutRouter.post('/create-checkout-session', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product")
    if(!cart || cart.items.length === 0){
      return res.status(400).json({ message: "empty cart" })
    }

    //Convert cart to stripe format
    const line_items = cart.items.map(item => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.product.name },
        unit_amount: Math.round(item.product.prices * 100)
      },

      quantity: item.quantity
    }))

    //create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // card-only payment
      line_items,
      mode: "payment",
      success_url: "http://localhost:3000/success", // user re-directed to success path
      cancel_url: "http://localhost:3000/cancel", // user re-directed to cancel path
      client_reference_id: req.user.id  
    })

    res.status(200).json({ url: session.url }) // sends success_url/cancel_url
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default checkoutRouter