const router = require('express').Router()
const supabase = require('../../db/supabaseClient')
const jwt = require('jsonwebtoken');
const config = require('../../config/config')

router.post('/to-pay', async (req, res) => {
    const { id, amount, paid_date } = req.body

    try {
        const { data, error } = await supabase
            .from('payments')
            .update({
                status: 'paid'
                ,paid_date: paid_date
            })
            .eq('id', id)
            .select()
        
        if (error)
            throw new Error(`Database error: ${error.message}`)

        return res.status(200).json({
            success: true
            ,message: 'The payment was successfully paid'
            ,data
        })
    } catch (err) {
        return res.status(500).json({
            succces: false
            ,message: err.message
        })
    }
})

module.exports = router