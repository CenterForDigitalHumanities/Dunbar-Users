#!/usr/bin/env node

const ManagementClient = require('auth0').ManagementClient
const express = require('express')
const router = express.Router()
const got = require('got')
const auth = require('../auth')

//Behind the scenes the Client Credentials Grant is used to obtain the access_token and is by default cached for the duration of the returned expires_in value
//There are too many scopes.  Just wanted them listed so you know what to work with.  Use them all for now, see what happens. 
let auth0 = new ManagementClient({
  domain: process.env.DOMAIN,
  clientId: process.env.CLIENTID,
  clientSecret: process.env.CLIENT_SECRET,
  scope: "create:users read:users read:user_idp_tokens update:users delete:users read:roles create:roles update:roles delete:roles"
})

/**
 * We trust this as our Auth0 server, because it's ours.
 * Ask our Dunbar Auth0 for an access token with user management scope.
 */ 
router.get('/getManagementToken', async function(req,res,next){
  //let token = await auth0.getAccessToken()
  //res.status(200).send(token)
  auth0.getAccessToken()
  .then(tok => {
    console.log("tok is")
    console.log(tok)
    res.status(200).send(tok)
  })
  .catch(err => {
    res.status(500).send(err)    
  })
  
})

/**
 * We trust this as our Auth0 server, because it's ours.
 * Ask our Dunbar Auth0 for a fresh access token with user management scope.
 */ 
router.get('/refreshManagementToken', async function(req,res,next){
  res.status(200).send("Nothing Yet")
})

/**
 * We trust this as our Auth0 server, because it's ours.
 * Tell our Dunbar Auth0 to assign the given user id to the Dunbar Public role.
 * This limits access token scope.
 * Other roles are removed.
 */ 
router.get('/assignPublicRole/:_id', async function(req,res,next){
    const params =  { "id" : req.params["_id"]}
    const data = { "roles" : [process.env.PUBLIC_ROLE_ID]}
    auth0.users.assignRolesToUser(params, data)
    .then(resp => {
      console.log("resp is")
      console.log(resp)
      if(resp.ok){
         res.status(200).send("Public role was successfully assinged to the user")  
      }
      else{
        res.status(500).send("Internal error assigning role to use")
      }
    })
    .catch(err => {
      res.status(500).send(err)  
    })

    /*
     auth0.users.assignRolesToUser(params, data, function (err, user) {
      if (err) {
          // Handle error.
          console.error(err)
          res.status(500).json(err)
      }
      res.status(200).send("Public role was successfully assinged to the user")
    })
    */ 
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

exports.onExecutePostLogin = async (event, api) => {
    const authorization = event.authorization ?? {roles:[]}
    console.log("roles in action is")
    console.log(authorization)
    if(authorization.hasOwnProperty("roles") && authorization.roles.length>0){
      api.accessToken.setCustomClaim('http://dunbar.rerum.io/user_roles', authorization);  
      api.idToken.setCustomClaim('http://dunbar.rerum.io/user_roles', authorization);  
    }
};