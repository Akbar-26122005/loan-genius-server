const router = require('express').Router()
const supabase = require('../../db/supabaseClient');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const { sendMessage } = require('../../config/notifications');

const cookieOptions = {
    httpOnly: true
    ,secure: true
    ,sameSite: 'none'
    ,maxAge: 3 * 60 * 60 * 1000 // 3 hours
    ,path: '/'
}

// Проверка авторизованности пользователя
router.get('/check', async (req, res) => {
    try {
        const session = req.cookies.session

        if (!session) {
            return res.status(200).json({
                isAuthenticated: false,
                message: 'The session does not exist'
            })
        }

        const decoded = await jwt.verify(session, config.jwt_secret);

        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                passports (*),
                applications (
                    *,
                    credit_products: product_id (*),
                    loans (
                        *,
                        contracts (
                            *,
                            payments (*)
                        )
                    )
                )
            `)
            .eq('id', decoded.userId)
            .single()
        
        if (error)
            throw new Error(error.message)

        if (data.length === 0) {
            res.clearCookie('session', cookieOptions)
            return res.status(200).json({
                isAuthenticated: false
                ,message: 'The data will be deleted from the database'
            })
        }

        res.cookie('session', session, cookieOptions)

        let info = undefined
        if (data.is_staff) {
            const { data: employeeData, error: employeeError } = await supabase
            .from('users')
            .select(`
                *,
                passports (*),
                applications (
                    *,
                    credit_products: product_id (*),
                    loans (
                        *,
                        contracts (
                            *,
                            payments (*)
                        )
                    )
                )
            `)

            info = employeeData
        }

        return res.status(200).json({
            isAuthenticated: true
            ,message: 'The user is logged in'
            ,user: {
                ...data
                ,password: undefined
            }
            ,res: info
        })
    } catch (err) {
        console.error(err.message)
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
        
        res.clearCookie('session', cookieOptions)

        return res.status(200).json({
            success: true
            ,message: 'Successfully logged out'
        })
    } catch (err) {
        console.error(err.message)
        return res.status(500).json({
            success: false
            ,message: 'Internal server error during logout: ' + err.message
        })
    }
})

// Регистрация
router.post('/sign-up', async (req, res) => {
    try {
        const { email, phone_number, password, first_name, last_name, middle_name, birth_date } = req.body;
    
        if (!email || !phone_number || !password || !first_name || !last_name || !birth_date) {
            return res.status(400).json({
                success: false
                ,message: 'Email, user names and password are required'
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
            .or('email.eq.email,phone_number.eq.phone', {
                email: email
                ,phone: phone_number
            })
        
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
    
        const { data: users, error: createError} = await supabase
            .from('users')
            .insert([{
                email
                ,phone_number: phone_number
                ,password: hashedPassword
                ,first_name: first_name
                ,last_name: last_name
                ,middle_name: middle_name
                ,birth_date: birth_date
                ,registration_date: new Date()
                ,last_login: new Date()
                ,is_staff: false
            }])
            .select()
        
        if (createError) {
            return res.status(500).json({
                success: false
                ,message: 'Failed to create user'
            })
        }
    
        const newUser = users[0]
    
        // Генерация jwt-токена
        const session = jwt.sign(
            { userId: newUser.id }
            ,config.jwt_secret
            ,{ expiresIn: '24h' }
        )

        res.cookie('session', session, cookieOptions)

        return res.status(200).json({
            success: true
            ,message: 'Successful registration'
            ,user: {
                id: newUser.id
                ,email: newUser.email
                ,phone_number: newUser.phone_number
                ,first_name: newUser.first_name
                ,last_name: newUser.last_name
                ,middle_name: newUser.middle_name
                ,is_staff: newUser.is_staff
            }
        })
    } catch (err) {
        console.error(err.message)
        return res.status(500).json({
            success: false
            ,message: err.message
        })
    }
})

// Вход
router.post('/log-in', async (req, res) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({
                success: false
                ,message: 'Login and password required'
            })
        }

        const { data: users, error } = await supabase
            .from('users')
            .select('*')
        
        if (error) {
            return res.status(500).json({
                success: false
                ,message: `Database error: ${error.message}`
            })
        }

        const user = users.find((user) => user.email === login || user.phone_number === login)

        if (user === null) {
            return res.status(401).json({
                success: false
                ,message: 'Invalid email or password'
            })
        }

        const isPasswordValid = await config.verifyPassword(password, user.password)

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false
                ,message: 'Invalid email or password'
            })
        }

        const { data: updatedData, error: updatedError } = await supabase
            .from('users')
            .update({ last_login: new Date() })
            .eq('id', user.id)
        
        if (updatedError) {
            return res.status(500).json({
                success: false
                ,message: 'Database error'
            })
        }

        // Генерация jwt-токена
        const session = jwt.sign(
            { userId: user.id }
            ,config.jwt_secret
            ,{ expiresIn: '24h' }
        )

        res.cookie('session', session, cookieOptions)

        const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
        console.log(fullUrl)

        return res.status(200).json({
            success: true
            ,message: 'Login successful'
            ,user: {
                id: user.id
                ,email: user.email
                ,phone_number: user.phone_number
                ,first_name: user.first_name
                ,last_name: user.last_name
                ,middle_name: user.middle_name
                ,is_staff: user.is_staff
            }
        })
    } catch (err) {
        console.error(err.message)
        return res.status(500).json({
            success: false
            ,message: err.message
        })
    }
})

router.post('/update', async (req, res) => {
    const { id, email, phone_number, first_name, last_name, middle_name } = req.body

    try {
        if (!id || !email || !phone_number || !first_name || !last_name || !middle_name) {
            return res.status(400).json({
                success: false
                ,message: 'There is not enough data'
            })
        }

        const { data, error } = await supabase
            .from('users')
            .update({
                email
                ,phone_number
                ,first_name
                ,last_name
                ,middle_name
            }).eq('id', id)
            .select()
        
        if (error)
            throw new Error('Database error')

        return res.status(200).json({
            success: true
            ,message: 'The data was updated successfully'
            ,user: data[0]
        })
    } catch (err) {
        console.error(err.message)
        return res.status(500).json({
            success: false
            ,message: err.message
        })
    }
})

module.exports = router
