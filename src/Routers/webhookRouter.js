import express from "express";
import Stripe from "stripe";
import bodyParser from "body-parser";
import Cart from "../Modules/cart.js";
import Order from "../Modules/order.js";
import dotenv from 'dotenv'

dotenv.config()

const webhookRouter = express.Router();
const stripe = new Stripe(process.env.STRIPE_API_SECRET_KEY);

webhookRouter.post(
  "/stripe",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.log("Webhook signature verification failed", error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      try {
        const cart = await Cart.findOne({
          user: session.client_reference_id,
        }).populate("items.product");

        if (cart && cart.items.length > 0) {
          //create new order in database
          const order = new Order({
            user: session.client_reference_id,
            items: cart.items,
            totalPrice: session.amount_total / 100, // stripe uses cents
            status: "Paid",
          });

          await order.save();

          //clear the cart
          cart.items = [];
          await cart.save();

          console.log(`✅ Order created for user ${session.client_reference_id}`);
        }
      } catch (error) {
        console.log(`Webhook Error: ${error.message}`)
      }

    }
    res.json({ received: true });
  }
);

export default webhookRouter;
