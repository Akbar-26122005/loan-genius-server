const nodemailer = require('nodemailer')
const config = require('../config/config')

const transporter = nodemailer.createTransport({
    service: 'Gmail'
    ,auth: {
        user: config.gmailUser || 'nurmatovakbar59@gmail.com'
        ,pass: config.gmailPass || 'Loan-Genius-Pay'
    }
})

const sendMessage = async (to) => {
    await transporter.sendMail({
        from: 'Кредитный сервис Loan Genius'
        ,to: to
        ,subject: 'Напоминание о платеже'
        ,html: `
            <p>Не забудьте оплатить кредит дод 28.06.2025г</p>
        `
    })
}

module.exports = {
    sendMessage
}