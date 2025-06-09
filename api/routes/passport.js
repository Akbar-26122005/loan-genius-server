const router = require('express').Router()
const supabase = require('../../db/supabaseClient')
const jwt = require('jsonwebtoken')
const config = require('../../config/config')

// Получение паспортных данных пользователя
router.get('/get', async (req, res) => {
    const { user_id } = req.query

    try {
        const { data, error } = await supabase
            .from('passports')
            .select('*')
            .eq('user_id', user_id)
            .limit(1)
        
        if (error)
            throw new Error('Database error')

        if (data.length === 0) {
            return res.status(201).json({
                success: false
                ,message: 'The user does not exist'
            })
        }

        return res.status(200).json({
            success: true
            ,message: 'Passport found successfully'
            ,passport: data[0]
        })
    } catch (err) {
        return res.status(500).json({
            success: false
            ,message: err.message
        })
    }
})

router.post('/create', async (req, res) => {
    const { user_id, series, number, issued_by, issue_date, division_code, registration_address } = req.body;

    try {
        if (!user_id || !series || !number || !issued_by || !issue_date || !division_code || !registration_address) {
            return res.status(400).json({
                success: false
                ,message: 'There is not enough data'
            })
        }
    
        const { data, error } = await supabase
            .from('passports')
            .insert({
                user_id
                ,series
                ,number
                ,issued_by
                ,issue_date
                ,division_code
                ,registration_address
            }).select()
        
        if (error)
            throw new Error('Database error')

        return res.status(200).json({
            success: true
            ,message: 'The data was created successfully'
            ,passport: data[0]
        })
    } catch (err) {
        return res.status(500).json({
            success: false
            ,message: err.message
        })
    }
})

router.post('/update', async (req, res) => {
    const { id, user_id, series, number, issued_by, issue_date, division_code, registration_address } = req.body;

    try {
        if (!id || !user_id || !series || !number || !issued_by || !issue_date || !division_code || !registration_address) {
            return res.status(400).json({
                success: false
                ,message: 'There is not enough data'
            })
        }

        const { data, error } = await supabase
            .from('passports')
            .update({
                series
                ,number
                ,issued_by
                ,issue_date
                ,division_code
                ,registration_address
            }).eq('id', id)
            .select()
        
        if (error)
            throw new Error('Database error')

        return res.status(200).json({
            success: true
            ,message: 'The data was updated successfully'
            ,passport: data[0]
        })
    } catch (err) {
        return res.status(500).json({
            success: false
            ,message: err.message
        })
    }
})

module.exports = router