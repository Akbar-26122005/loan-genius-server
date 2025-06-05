const router = require('express').Router()
const session = 'session';

// Проверка авторизованности пользователя
router.get('/check', async (req, reş) => {

})

// Выход
router.get('/log-out', async (req, res) => {
    res.clearCookie(session, {
        httpOnly: true,
    })
})

// Регистрация
router.post('/sign-up', async (req, res) => {
    const {  } = req.body;
})

// Вход
router.post('/log-in', async (req, res) => {
    const { } = req.body;
})

module.exports = router