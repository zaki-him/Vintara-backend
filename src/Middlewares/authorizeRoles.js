const authorizeRoles = (roles) => {
  return (req , res , next) => {
    if(!roles.includes(req.user.role)){
      return res.status(403).json({ message: 'Forbiden'})
    }
    console.log('User Role:' , req.user.role)
    next()
  }
}

export default authorizeRoles