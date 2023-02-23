#!/usr/bin/env node

let express = require('express')
let router = express.Router()

const staticRouter = require('./static')
router.get('/',staticRouter)

const managementRouter = require('./routes/manage-api.js')
router.use('/dunbar-users/manage', managementRouter)

const dunbarRouter = require('./routes/dunbar-users.js')
router.use('/dunbar-users', dunbarRouter)

module.exports = router
