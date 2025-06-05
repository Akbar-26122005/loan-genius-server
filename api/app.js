const http = require('http')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const express = require('express')
const config = require('../config/config');

const app = express()
const server = http.createServer(app)

const Auth = require('./routes/auth')

app.use(cors({
    origin: 'http://localhost:3000'
    ,credentials: true
    ,methods: [ 'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS ' ]
    ,allowedHeaders: [ 'Content-Type' ]
}))
app.use(express.json())
app.use(cookieParser())

app.use('/auth', Auth)

app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/pages/welcomePage.html')
})

function startServer(port = config.port) {
    port = port || 5000
    server.listen(port, () => console.log(`Server is running at http://localhost:${port}`))
}

module.exports = startServer