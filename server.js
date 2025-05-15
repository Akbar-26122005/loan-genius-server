const http = require('http');
const https = require('https');
const cors = require('cors');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 5000;
const pool = require('./db');

// Функция для хэширования пароля
async function hashPassword(password) {
    const saltRounds = 10; // Количество раундов для генерации соли
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

// Функция для проверки пароля
async function checkPassword(password, hashedPassword) {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
}

const corsOptions = {
    origin: "http://localhost:3000",
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/login-user', async (req, res) => {
    const { login, password } = req.body;

    // Проверка на наличие логина и пароля
    if (!login || !password)
        return res.status(400).json({message: 'Login and password are required.'});

    try {

        const result = await pool.query(`SELECT * FROM users WHERE email = '${login}'`);
        if (result.rows.length === 0)
            return res.status(401).json({ message: 'Invalid login or password' });

        // Проверка пароля
    } catch (error) {
        console.error(`${error}`);
    }
    
    res.json({message: 'Successful login.'});
});

app.listen(PORT, () => console.log(`Server running on address: http://localhost:${PORT}`));