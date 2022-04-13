var express = require('express')
var router = express.Router()
const auth = require('../auth')

router.get('/register', function(req,res,next){
  //Register means become part of the user DB on Auth0, or be identified for login
      var params = new URLSearchParams({
          // "audience":process.env.AUDIENCE,
          // "scope":"openid name email offline_access",
          //"scope":"name email openid offline_access",
          //"response_type":"code",
          "response_type":"token",
          "client_id":process.env.CLIENTID,
          "redirect_uri":process.env.DUNBAR_PREFIX,
          "state":"dunbar123"           
      }).toString()
      res.status(200).send("https://cubap.auth0.com/authorize?" + params)
  })

module.exports = router
