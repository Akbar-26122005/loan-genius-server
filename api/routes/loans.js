const router = require('express').Router()
const supabase = require('../../db/supabaseClient')
const jwt = require('jsonwebtoken')
const config = require('../../config/config')

router.get('/get', async (req, res) => {
    const { id } = req.query
    try {
        if (!id) {
            return res.status(400).json({
                success: false
                ,message: 'Loan ID is required'
            })
        }

        const { data, error } = await supabase
            .from('loans')
            .select(`
                *,
                applications!inner(
                    *,
                    credit_products:product_id(
                        id,
                        name
                    )
                )
            `)
            .eq('id', id)
            .single()
        
        if (error) throw error

        if (!data) {
            return res.status(404).json({
                success: false
                ,message: 'Loan not found'
            })
        }

        return res.status(200).json({
            success: true
            ,message: 'The data was received successfully'
            ,loan: data
        })
    } catch (err) {
        return res.status(500).json({
            success: false
            ,message: err.message
        })
    }
})

router.get('/get-all', async (req, res) => {
    const { user_id }  = req.query
    try {
        if (!user_id) {
            return res.status(400).json({
                success: false
                ,message: 'User ID is required'
            })
        }

        const { data, error } = await supabase
            .from('applications')
            .select(`
                id,
                loans (*),
                credit_products:product_id (
                    id,
                    name
                )
            `).eq('user_id', user_id)
        
        if (error)
            throw new Error('Database error:' + error.message)

        if (data.length === 0) {
            return res.status(200).json({
                success: false
                ,message: 'There are no records in the database'
            })
        }

        return res.status(200).json({
            success: true
            ,message: ''
            ,loans: data
        })
    } catch (err) {
        return res.status(500).json({
            success: false
            ,message: err.message
        })
    }
})

module.exports = router