import express from 'express'
import User from '../Modules/user.js'
import protect from '../Middlewares/protect.js'
import authorizeRoles from '../Middlewares/authorizeRoles.js'

const userRouter = express.Router()

//protected route
userRouter.get('/profile', protect, (req, res) => {
  res.json({ message: 'Profile accessed' , user: req.user })
})

userRouter.get('/admin', protect, authorizeRoles(['admin']), (req, res) => {
  res.json({ message: 'Welcome admin', user: req.user })
})

userRouter.put('/profile', protect, async (req, res) => {
  try {
    const { name, address, phone } = req.body
    const user = await User.findById(req.user.id)

    if(!user){
      return res.status(404).json({ message: 'User Not Found' })
    }

    user.name = name || user.name
    user.address = address || user.address
    user.phone = phone || user.phone

    await user.save()

    res.status(200).json({ message: 'Profile updated '})
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default userRouter