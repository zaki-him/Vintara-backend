import multer from 'multer'

//store file in memory (not in disk)
const storage = multer.memoryStorage()

const upload = multer({ storage })

export default upload