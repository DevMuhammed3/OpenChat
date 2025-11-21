import { Router } from 'express'
import passport from 'passport'
import { generateToken } from '../utils/generateToken.js'
import { AuthController } from '../controllers/auth.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

const router: Router = Router()

router.post('/register', AuthController.register)
router.post('/login', AuthController.login)
router.get('/profile', authMiddleware, AuthController.getProfile)

// Discord OAuth routes
router.get('/discord', passport.authenticate('discord'))

router.get(
    '/discord/callback',
    passport.authenticate('discord', {
        failureRedirect: 'http://localhost:3000/login',
    }),
    (req, res) => {
        const token = generateToken(req.user!.id)
        res.redirect(`http://localhost:3000/auth/?token=${token}`)
    }
)

// Twitter OAuth routes
router.get('/twitter', passport.authenticate('twitter'))

router.get(
    '/twitter/callback',
    passport.authenticate('twitter', {
        failureRedirect: 'http://localhost:3000/login',
    }),
    (req, res) => {
        const token = generateToken(req.user!.id)
        res.redirect(`http://localhost:3000?token=${token}`)
    }
)

export default router
