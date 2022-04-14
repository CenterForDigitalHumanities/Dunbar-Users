var express = require('express')
var router = express.Router()
const got = require('got')
const auth = require('../auth')
const auth0 = require ('auth0')
const AuthenticationClient = auth0.AuthenticationClient

router.get('/connect', function(req,res,next){
  // let authClient = new AuthenticationClient({
  //   domain:       process.env.DOMAIN,
  //   clientID:     process.env.CLIENTID
  // })
  let webAuth = new auth0.WebAuth({
      domain:       process.env.DOMAIN,
      clientID:     process.env.CLIENTID
  })
  // Trigger login, it will take you back to login.html with the access token
  res.status(301) // maybe redirect?
  return webAuth.authorize({
      "audience":process.env.AUDIENCE,
      "scope":"name email openid profile offline_access",
      "responseType":"token",
      "redirectUri":process.env.DUNBAR_REDIRECT,
      "state":"dunbar123"      
  })
})

router.get('/disconnect', function(req,res,next){
  // let authClient = new AuthenticationClient({
  //   domain:       process.env.DOMAIN,
  //   clientID:     process.env.CLIENTID
  // })
  let webAuth = new auth0.WebAuth({
      domain:       process.env.DOMAIN,
      clientID:     process.env.CLIENTID
  })
  // Trigger login, it will take you back to login.html with the access token
  res.status(301) // maybe redirect?
  return webAuth.logout({
        returnTo: process.env.DUNBAR_REDIRECT,
        client_id: process.env.CLIENTID
    })
})

router.get('/dunbar-user', async function(req,res,next){
  let user = null
  if(req.query.access_token){
    //We want Auth0 to give us the user info for this access token
    webAuth.client.userInfo(getURLHash("access_token"), function(err, u) {
        res.status(200)
        res.json(u)
    })
  }
  else{
    res.status(400).send("Your request does not contain an access token.")
  }
})

module.exports = router
