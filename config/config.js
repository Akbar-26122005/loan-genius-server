const bcrypt = require('bcrypt');
require('dotenv').config()

module.exports = {
    port: process.env.SERVER_DEFAULT_PORT || 5000
    ,client_origin: process.env.CLIENT_ORIGIN
    ,supabase: {
        url: process.env.SUPABASE_PROJECT_URL
        ,key: process.env.SUPABASE_PROJECT_KEY
    }
    ,jwt_secret: process.env.JWT_SECRET
    ,node_env: process.env.NODE_ENV
    ,hashPassword: async (password) => {
        const salt = await bcrypt.genSalt(10)
        return await bcrypt.hash(password, salt)
    }
    ,verifyPassword: async (password, storedHash) => await bcrypt.compare(password, storedHash)
}