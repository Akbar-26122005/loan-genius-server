const router = require('express').Router()
const supabase = require('../../db/supabaseClient')
const jwt = require('jsonwebtoken')
const config = require('../../config/config')

router.get('/get-all', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('credit_products')
            .select('*')
        
        if (error)
            throw new Error('Database error')

        return res.status(200).json({
            success: true
            ,message: ''
            ,credit_products: data
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
})

module.exports = router