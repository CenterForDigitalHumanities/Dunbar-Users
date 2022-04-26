var express = require('express')
var path = require('path')
var router = express.Router()
const managementRouter = require('./manage.js')
// public also available at `/dunbar-users` now
router.use(express.static(path.join(__dirname, '../public')))

//The /dunbar-users/manage endpoint stuff
router.use('/manage', managementRouter)

/* GET home page.  Redirect to login */
router.get('/', function(req, res, next) {
  res.redirect(301, 'login.html')
})


module.exports = router
