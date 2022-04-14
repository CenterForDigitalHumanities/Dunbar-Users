//Imagine this as a proxy piece of a client that other clients that are a part of this Organization can use
//Dunbar Clients can call to this to be their auth0 client.  They should be able to login, logout and get their user profile. 

var express = require('express')
var router = express.Router()
const got = require('got')
const auth = require('../auth')

router.get('/connect', function(req,res,next){
  //Register means become part of the user DB on Auth0, or be identified for login
  //This is a 'Social Login'
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

router.get('/disconnect', function(req,res,next){
//This does not invalidate an access token.  They cannot be invalidated. 
//See https://community.auth0.com/t/invalidating-an-access-token-when-user-logs-out/48365
/*
Logging out destroys the session, but not access tokens.
Access tokens cannot be revoked. They are self-contained, enabling verification by the backend without contacting Auth0 (except to get the signature verification keys which don’t change very often and should be cached). Thus there is no way to revoke them.
Make your access tokens shortlived because of this.
*/
//So can I check on the session with an auth0 endpoint somehow.
      var params = new URLSearchParams({
          "audience":process.env.AUDIENCE,
          "client_id":process.env.CLIENTID,
          "returnTo":process.env.DUNBAR_REDIRECT+"?loggedOut=true",     
      }).toString()
      res.status(200).send("https://cubap.auth0.com/v2/logout?" + params)
  })

router.get('/dunbar-user', async function(req,res,next){
  let user = {}
  if(req.query.access_token){
    try {
      //We hoped /userinfo would fail if they logout.  It does not.
      user = await got.get("https://cubap.auth0.com/userinfo?access_token="+req.query.access_token).json()
      console.log("Give back user from /dunbar-user")
      console.log(user)
    } 
    catch (e) {
      console.error(e)
      res.status(401).send("This token is dead Jim")
    }
    res.status(200).json(user)
  }
  else{
    res.status(400).send("Your request does not contain an access token.")
  }
})

module.exports = router