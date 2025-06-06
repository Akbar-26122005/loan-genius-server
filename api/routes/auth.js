const router = require('express').Router()
const session = 'session';
const supabase = require('../../db/supabaseClient');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../../config/config');

const cookieOptions = {
    httpOnly: true
    ,secure: config.NODE_ENV === 'production'
    ,sameSite: config.NODE_ENV === 'production'
    ,maxAge: 24 * 60 * 60 * 1000
    ,path: '/'
}

// Проверка авторизованности пользователя
router.get('/check', async (req, res) => {
    try {
        const session = req.cookies.session

        if (session)
            return res.status(200).json({ isAuthenticated: false, message: 'The session does not exist' })

        const decoded = await jwt.verify(session, config.jwt_secret);

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.userId)
            .limit(1)
        
        if (error)
            throw new Error(error.message)

        const user = data[0]

        return res.status(200).json({
            isAuthenticated: true
            ,user: {
                id: user.id
                ,email: user.email
                ,name: user.name
            }
        })
    } catch (err) {
        return res.status(500).json({
            isAuthenticated: false
            ,message: err.message
        })
    }
})

// Выход
router.get('/log-out', async (req, res) => {
    try {
        const session = req.cookies.session;

        if (!session) {
            return res.status(200).json({
                success: true,
                message: 'No active session found'
            })
        }

        res.clearCookie(session, {
            httpOnly: true
            ,secure: config.NODE_ENV === 'production'
            ,sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax'
        })

        return res.status(200).json({
            success: true
            ,message: 'Successfully logged out'
        })
    } catch (err) {
        return res.status(500).json({
            success: false
            ,message: 'Internal server error during logout'
        })
    }
})

// Регистрация
router.post('/sign-up', async (req, res) => {
    try {

        const { email, password, name } = req.body;
    
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false
                ,message: 'Email, password and username are required'
            })
        }
    
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false
                ,message: 'Invalid email format'
            })
        }
    
        if (password.length < 8) {
            return res.status(400).json({
                success: false
                ,message: 'Password must be at least 8 characters long'
            })
        }
    
        const { data: existingUser, error: lookupError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .limit(1)
        
        if (lookupError) {
            return res.status(500).json({
                success: false
                ,message: 'Database error'
            })
        }
    
        if (existingUser > 0) {
            return res.status(409).json({
                success: false
                ,message: 'Email already exists'
            })
        }
    
        const hashedPassword = await config.hashPassword(password)
    
        const { data: user, error: createError} = await supabase
            .from('users')
            .insert([{
                email
                ,password: hashedPassword
                ,name
            }])
            .select('*')
        
        if (createError) {
            return res.status(500).json({
                success: false
                ,message: 'Failed to create user'
            })
        }
    
        const newUser = user[0]
    
        // Генерация jwt-токена
        const session = jwt.sign(
            { userId: newUser.id }
            ,config.jwt_secret
            ,{ expiresIn: '24h' }
        )

        res.cookie('session', session, cookieOptions)
    } catch (err) {
        return res.status(500).json({
            success: false
            ,message: err.message
        })
    }
})

// Вход
router.post('/log-in', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false
                ,message: 'Email and password required'
            })
        }

        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .limit(1)
        
        if (error) {
            return res.status(500).json({
                success: false
                ,message: 'Database error'
            })
        }

        if (users.length === 0) {
            return res.status(401).json({
                success: false
                ,message: 'Invalid email or password'
            })
        }

        const user = users[0]

        const isPasswordValid = await verifyPassword(password, user.password)

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false
                ,message: 'Invalid email or password'
            })
        }

        // Генерация jwt-токена
        const session = jwt.sign(
            { userId: user.id }
            ,config.jwt_secret
            ,{ expiresIn: '24h' }
        )

        res.cookie('session', session, cookieOptions)

        return res.status(200).json({
            success: true
            ,message: 'Login successful'
            ,user: {
                id: user.id
                ,email: user.email
                ,name: user.name
            }
        })
    } catch (err) {
        return res.status(500).json({
            success: false
            ,message: err.message
        })
    }
})

module.exports = router