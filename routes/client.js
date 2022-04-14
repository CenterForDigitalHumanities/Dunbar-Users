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
      res.status(301).send("https://cubap.auth0.com/authorize?" + params)
  })

router.get('/disconnect', function(req,res,next){
  //Logout this user
      var params = new URLSearchParams({
          "client_id":process.env.CLIENTID,
          "returnTo":process.env.DUNBAR_REDIRECT      
      }).toString()
      res.status(301).send("https://cubap.auth0.com/v2/logout?" + params)
  })

router.get('/dunbar-user', async function(req,res,next){
  let user = null
  if(req.query.access_token){
    let user = await got.get("https://cubap.auth0.com/userinfo?access_token="+req.query.access_token)
    .then(res => res.json())
    .catch(err =>{
        console.error(err)
        res.status(401).send("This token is dead Jim")
    }) 
    return user
  }
  else{
    res.status(400).send("Your request does not contain an access token.")
  }
})

module.exports = router