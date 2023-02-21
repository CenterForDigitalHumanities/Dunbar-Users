#!/usr/bin/env node

let express = require('express')
let router = express.Router()

const staticRouter = require('./static')
router.get('/',staticRouter)

const manageAPI = require('./manage-api')
router.get('/',manageAPI)

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/index.html',200)
})

module.exports = router
