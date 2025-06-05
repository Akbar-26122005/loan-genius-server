const http = require('http')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const express = require('express')

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
    res.sendFile(__dirname + '/displays/welcomePage.html')
})

function startServer(port = null) {
    port = port || 3000
    server.listen(port, () => console.log(`Server is running at http://localhost:${port}`))
}

module.exports = startServer