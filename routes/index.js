#!/usr/bin/env node

let express = require('express')
let router = express.Router()

const staticRouter = require('./static')
router.get('/',staticRouter)

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/index.html')
})

module.exports = router
