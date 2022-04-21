const ManagementClient = require('auth0').ManagementClient
const express = require('express')
const router = express.Router()
const got = require('got')
const auth = require('../auth')

//Behind the scenes the Client Credentials Grant is used to obtain the access_token and is by default cached for the duration of the returned expires_in value
var auth0 = new ManagementClient({
  domain: process.env.DOMAIN,
  clientId: process.env.CLIENTID,
  scope: 'read:users update:users profile',
})

router.get('/connect', function(req,res,next){
  //Send the user off to login, return them to manage.html and caches their access token
  var params = new URLSearchParams({
      "audience":process.env.AUDIENCE,
      "scope":"read:users update:users profile openid offline_access",
      "response_type":"token",
      "client_id":process.env.CLIENTID,
      "redirect_uri":process.env.DUNBAR_REDIRECT          
  }).toString()
  res.status(200).send("https://cubap.auth0.com/authorize?" + params)
})

router.get('/disconnect', function(req,res,next){\

  res.status(200).send("Hello World")
})

router.get('/revalidate', async function(req,res,next){
  if(req.query.access_token){
    // !!! TODO detect a cached access token !!!
    //If there is an access token in cache, it is added as the Bearer behind the scenes for this.
    //This credentials grant will fail in the access token in cache is already expired.  They will have to log in again.
      auth0.clientCredentialsGrant(
      {
        audience: 'https://{YOUR_ACCOUNT}.auth0.com/api/v2/',
        scope: '{MANAGEMENT_API_SCOPES}',
      },
      function (err, response) {
        if (err) {
          // Handle error.  Probably make them login again
          res.status(500).send(err)
        }
        res.status(200).send(response.access_token)
      }
    )
  }
  else{
    //If there is no access token in cache, then we know there will be no authorization.  Login again.
    res.status(400).send("Your request does not contain an access token.")
  }  
  
})

router.get('/getAllUsers', async function(req,res,next){
  let user = {}
  if(req.query.access_token){

  }
  else{

    res.status(400).send("Your request does not contain an access token.")
  }
})

router.get('/getAllUsers', async function(req,res,next){
  let user = {}
  if(req.query.access_token){
    
  }
  else{

    res.status(400).send("Your request does not contain an access token.")
  }
})

router.get('/updateUserProfile', async function(req,res,next){
  let user = {}
  if(req.query.access_token){

  }
  else{

    res.status(400).send("Your request does not contain an access token.")
  }
})

