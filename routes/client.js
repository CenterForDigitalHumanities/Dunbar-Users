var express = require('express')
var router = express.Router()
const got = require('got')
const auth = require('../auth')

router.get('/connect', function(req,res,next){
  //Register means become part of the user DB on Auth0, or be identified for login
      var params = new URLSearchParams({
          "audience":process.env.AUDIENCE,
          "scope":"name email openid profile offline_access",
          "response_type":"token",
          "client_id":process.env.CLIENTID,
          "redirect_uri":process.env.DUNBAR_REDIRECT,
          "state":"dunbar123"           
      }).toString()
      res.status(200).send("https://cubap.auth0.com/authorize?" + params)
  })

router.get('/dunbar-user', async function(req,res,next){
  let user = null
  if(req.query.access_token){
    let user = await got.get("https://cubap.auth0.com/userinfo?access_token="+req.query.access_token).json()
    res.status(200).json(user)
    return user
  }
  else{
    res.status(400).send("Your request does not contain an access token.")
  }
})

module.exports = router
