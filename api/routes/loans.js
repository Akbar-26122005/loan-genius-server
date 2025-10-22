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
            ,message: 'The data was successfully received'
            ,loans: data
        })
    } catch (err) {
        return res.status(500).json({
            success: false
            ,message: err.message
        })
    }
})

router.post('/create', async (req, res) => {
    const { application, loan } = req.body

    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + (today.getDate() > 28 ? 2 : 1)
    const day = today.getDate() > 28 ? 1 : today.getDate()

    try {
        // Начало транзакции
        await supabase.rpc('begin')

        // change the status in applications
        const { data: applData, error: applError } = await supabase
            .from('applications')
            .update({ status: application.status })
            .eq('id', application.id)
            .select()
            .single()
        
        if (applError)
            throw new Error(`Database error(appl): ${applError.message}`)
        console.log('Данные обновлены в таблице applications, data:', applData)

        const { data, error } = await supabase
            .from('loans')
            .select('*')
            .eq('application_id', application.id)

        if (error)
            throw new Error(`Database error: ${error.message}`)
        console.log('Данные получены из таблицы loans, data: ', data)
        if (data.length > 0) {
            console.log('В бд loans уже имеется запись с уникальным id таблицы applications')
            return res.status(400).json({
                success: false
                ,message: 'The loans table already contains data with an id from applications'
            })
        }

        // create the row in loans
        const { data: loanData, error: loanError } = await supabase
            .from('loans')
            .insert({
                application_id: application.id
                ,final_amount: applData.amount
                ,final_term: applData.term
                ,final_rate: applData.rate
                ,disbursement_date: new Date(year, month, day)
                ,account_number: loan.account_number
            })
            .select()
            .single()
        
        if (loanError)
            throw new Error(`Database error(loan): ${loanError.message}`)
        console.log('Данные успешно создание в таблице loans, data: ', loanData)

        const monthlyRate = applData.rate / 100 / 12;
        const annuityPayment = applData.amount * 
            (monthlyRate * Math.pow(1 + monthlyRate, applData.term)) / 
            (Math.pow(1 + monthlyRate, applData.term) - 1);

        // create the row in contracts
        const { data: contractData, error: contractError } = await supabase
            .from('contracts')
            .insert({
                loan_id: loanData.id
                ,contract_number: loan.account_number
                ,start_date: new Date()
                ,end_date: new Date(year, today.getMonth() + applData.term, day)
                ,monthly_payment: annuityPayment
            })
            .select()
        
        if (contractError)
            throw new Error(`Database error(contract): ${contractError.message}`)
        console.log('Данные созданиы в таблице contracts, data:', contractData);
        
        const paymentSchedule = []
        let remainingBalance = application.amount

        for (let i = 0; i < applData.term; i++) {
            const paymentDate = new Date(year, month + i, day)
            const interestAmount = remainingBalance * monthlyRate
            const principalAmount = annuityPayment - interestAmount

            paymentSchedule.push({
                contract_id: contractData[0].id
                ,amount: annuityPayment
                ,scheduled_date: paymentDate.toISOString().split('T')[0]
                ,paid_date: null
                ,status: 'scheduled'
                ,principal_amount: parseFloat(principalAmount.toFixed(2))
                ,interest_amount: parseFloat(interestAmount.toFixed(2))
                ,remaining_balance: parseFloat((remainingBalance - principalAmount).toFixed(2))
            })

            remainingBalance -= principalAmount;
        }

        // create the data in payments
        const { data: paymentData, error: paymentError } = await supabase
            .from('payments')
            .insert(paymentSchedule)
            .select()
        
        if (paymentError)
            throw new Error(`Database error(payment): ${paymentError.message}`)
        console.log('Данные добавлены в таблицу payments, data:', paymentData)

        return res.status(200).json({
            success: true
            ,message: 'The data was created successfully'
            ,data: { applData, loanData, contractData, paymentData }
        })
    } catch (err) {
        console.log('Возникла ошибка:', err.message)
        await supabase.rpc('rollback')
        return res.status(500).json({
            success: false
            ,message: err.message
        })
    }
})

module.exports = router