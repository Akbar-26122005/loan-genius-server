const router = require('express').Router()
const supabase = require('../../db/supabaseClient')
const jwt = require('jsonwebtoken');
const config = require('../../config/config')

router.post('/set-status', async (req, res) => {
    try {
        const { id, status } = req.body

        const { data, error } = await supabase
            .from('applications')
            .update({ status: status })
            .eq('id', id)
            .select()
        
        if (error)
            throw new Error(`Database error: ${error.message}`)

        return res.status(200).json({
            success: true
            ,message: 'The data was received successfully'
            ,data: data
        })
    } catch (err) {
        return res.status(500).json({
            success: false
            ,message: err.message
        })
    }
})

router.get('/get-user', async (req, res) => {
    try {
        const { id } = req.query

        const { data, error } = await supabase
            .from('applications')
            .select(`
                users:user_id (
                    id,
                    email,
                    phone_number,
                    first_name,
                    last_name,
                    middle_name,
                    birth_date,
                    registration_date,
                    last_login,
                    is_staff
                ),
                credit_products:product_id (
                    name
                )
            `).eq('id', id)
            .single()
        
        if (error)
            throw new Error(`Database error: ${error.message}`)

        return res.status(200).json({
            success: true
            ,message: 'The data was received successfully'
            ,data: data
        })
    } catch (err) {
        return res.status(500).json({
            success: false
            ,message: err.message
        })
    }
})

router.get('/get-all', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('applications')
            .select(`
                *,
                credit_products:product_id (*)
            `)
        
        if (error)
            throw new Error(`Database error: ${error.message}`)

        return res.status(200).json({
            success: true
            ,message: 'The data was received successfully'
            ,data: data
        })
    } catch (err) {
        return res.status(500).json({
            success: false
            ,message: err.message
        })
    }
})

router.post('/create', async (req, res) => {
    try {
        const { user_id, product_id, created_at, updated_at, decision_date, purpose, rate, term, status, amount } = req.body

        for (let property in req.body) {
            if (!property) {
                return res.status(400).json({
                    success: false
                    ,message: 'Not enough data'
                })
            }
        }

        const { data, error } = await supabase
            .from('applications')
            .insert({
                user_id
                ,product_id
                ,created_at
                ,updated_at
                ,decision_date
                ,purpose
                ,rate
                ,term
                ,status
                ,amount
            })
            .select()
        
        if (error)
            throw new Error(`Database error: ${error.message}`)

        return res.status(200).json({
            success: true
            ,message: 'The application has been successfully submitted'
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