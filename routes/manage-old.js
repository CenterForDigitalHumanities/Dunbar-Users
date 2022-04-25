//Imagine this as a proxy piece of a client that other clients that are a part of this Organization can use
//Dunbar Clients can call to this to be their auth0 client.  They should be able to login, logout and get their user profile. 

var express = require('express')
var router = express.Router()
const got = require('got')
const auth = require('../auth')

router.get('/connect', function(req,res,next){
  //Register or login using the Auth0 Widget (this will redirect the user to that widget, widget will redirect back with info)
  //This responds to applications with the link for logging in to the Dunbar Auth0 Client.
  let state = req.query.state
  var params = new URLSearchParams({
      "audience":process.env.AUDIENCE,
      "scope":"name email openid profile offline_access",
      "response_type":"token",
      "client_id":process.env.CLIENTID,
      "redirect_uri":process.env.DUNBAR_REDIRECT,
      "state":state
      //"app_redirect" : redirection           
  }).toString()
  res.status(200).send("https://cubap.auth0.com/authorize?" + params)
})

router.get('/disconnect', function(req,res,next){
  //This does not invalidate an access token.  They cannot be invalidated. 
  //See https://community.auth0.com/t/invalidating-an-access-token-when-user-logs-out/48365
  var params = new URLSearchParams({
      "audience":process.env.AUDIENCE,
      "client_id":process.env.CLIENTID,
      "returnTo":process.env.DUNBAR_REDIRECT+"?loggedOut=true",     
  }).toString()
  res.status(200).send("https://cubap.auth0.com/v2/logout?" + params)
})

router.get('/revalidate', async function(req,res,next){
    //access tokens only live for 30 seconds.
    //This responds to applications with a fresh access token that can get /userinfo
    let params = {
        "audience":process.env.AUDIENCE,
        //"scope":"name email openid profile offline_access",
        "grant_type" : "client_credentials",
        "client_id":process.env.CLIENTID,
        "client_secret":process.env.CLIENT_SECRET
    }
    let headers = {
      "content-type" : 'application/x-www-form-urlencoded'
    }
    const {body, statusCode} = await got.post("https://cubap.auth0.com/oauth/token", {"headers":headers, "form":params})
    console.log(statusCode)
    console.log(body)
    let resp = body
    if (statusCode !== 200 || body.error) {
      resp = body.error
    }
    res.status(statusCode).json(body)
})



router.get('/getUserProfile', async function(req,res,next){
  let user = {}
  if(req.query.access_token){
    try {
      user = await got.get("https://cubap.auth0.com/userinfo?access_token="+req.query.access_token).json()
      console.log("Give back user from /dunbar-user")
      console.log(user)
      res.status(200).json(user)
    } 
    catch (e) {
      console.error(e)
      res.status(401).send("This token is dead Jim")
    }
  }
  else{
    res.status(400).send("Your request does not contain an access token.")
  }
})

function getURLHash(variable, url) {
    var query = url.substr(url.indexOf("#")+1)
    var vars = query.split("&")
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=")
        if (pair[0] == variable) { return pair[1] }
    }
    return false
}

module.exports = router