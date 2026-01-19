import User from "../Modules/user.js"
import generateToken from "./tokenGenerator.js"

const logUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if(!email || !password){
      return res.status(400).json({ message: 'Please enter all fields' })
    }

    const user = await User.findOne({ email })

    if(!user){
      return res.status(404).json({ message: 'User not found' })
    }

    const correctPass = await user.comparePassword(password)

    if(!correctPass){
      return res.status(401).json({ message: 'Wrong password' })
    }

    res.status(200).json({
      _id: user.id,
      email: user.email,
      token: generateToken(user)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export default logUser