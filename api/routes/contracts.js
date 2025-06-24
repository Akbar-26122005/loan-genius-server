const router = require('express').Router()
const supabase = require('../../db/supabaseClient')
const jwt = require('jsonwebtoken');
const config = require('../../config/config')

router.post('/create', async (req, res) => {
    const { loan_id, contract_number, start_date, end_date, monthly_payment } = req.body

    try {
        const { data, error } = await supabase
            .from('contracts')
            .insert({
                loan_id
                ,contract_number
                ,start_date
                ,end_date
                ,monthly_payment
            })
            .select()
            .single()
        
        if (error)
            throw new Error(`Database error: ${error.message}`)

        return res.status(200).json({
            success: true
            ,message: 'The data was created successfully'
            ,data: data
        })
    } catch (err) {
        return res.status(500).json({
            success: false
            ,message: err.message
        })
    }
})

module.exports = router