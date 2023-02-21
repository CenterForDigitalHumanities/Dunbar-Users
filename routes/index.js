#!/usr/bin/env node

let express = require('express')
let router = express.Router()

/* GET home page. */
router.get('/*', function(req, res, next) {
  res.sendFile('../manage.html',{root:__dirname})
  // res.render('index', { title: 'Dunbar Users' })
})

module.exports = router
