import multer from 'multer'
import path from 'path'

const storage = multer.diskStorage({
  destination: 'uploads',
  filename: (_, file, cb) => {
    const unique = Date.now() + path.extname(file.originalname)
    cb(null, unique)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only images allowed'))
      return
    }
    cb(null, true)
  },
})
