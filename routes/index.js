#!/usr/bin/env node

let express = require('express')
let router = express.Router()

const staticRouter = require('./static')
router.get('/',staticRouter)

const managementRouter = require('./manage-api')
router.use('/dunbar-users/manage', managementRouter)

const dunbarRouter = require('./dunbar-users')
router.use('/dunbar-users', dunbarRouter)

module.exports = router
