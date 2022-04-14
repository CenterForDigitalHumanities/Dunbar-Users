var express = require('express')
var router = express.Router()
const got = require('got')
const auth = require('../auth')
const auth0 = require ('auth0')
const AuthenticationClient = auth0.AuthenticationClient
const ManagementClient = require('auth0').ManagementClient;


router.get('/connect', function(req,res,next){
  let authClient = new AuthenticationClient({
    domain:  process.env.DOMAIN,
    clientId:  process.env.CLIENTID,
    clientSecret:  process.env.CLIENT_SECRET,
  })
  res.status(301) // maybe redirect?
  return authClient.loginWithRedirect({
          redirect_uri: "http://localhost:3000",
          audience:process.env.AUDIENCE,
          scope:"name email openid profile offline_access",
          responseType:"token",
          redirectUri:process.env.DUNBAR_REDIRECT,
          state:"dunbar123"   
  })
})

router.get('/disconnect', function(req,res,next){
  let authClient = new AuthenticationClient({
    domain:  process.env.DOMAIN,
    clientId:  process.env.CLIENTID,
    clientSecret:  process.env.CLIENT_SECRET    
  })
  res.status(301) // maybe redirect?
  return authClient.logout({
        returnTo: process.env.DUNBAR_REDIRECT,
        client_id: process.env.CLIENTID
    })
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
  /*
  //Hmm there isn't anything equivalent to using the access token to get the user profile.  Maybe we don't want the access token, maybe an id token instead?
  let user = null
  if(req.query.access_token){
    let managerClient = new ManagerClient({
      domain:  process.env.DOMAIN,
      token: req.query.access_token,   
    })
    managerClient.userInfo(req.query.access_token, function(err, u) {
        res.status(200)
        res.json(u)
    })
  }
  else{
    res.status(400).send("Your request does not contain an access token.")
  }
  */
})

module.exports = router
