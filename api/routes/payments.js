const router = require('express').Router()
const supabase = require('../../db/supabaseClient')
const jwt = require('jsonwebtoken');
const config = require('../../config/config')

module.exports = router