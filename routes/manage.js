#!/usr/bin/env node

const ManagementClient = require('auth0').ManagementClient
const AuthenticationClient = require('auth0').AuthenticationClient
const express = require('express')
const router = express.Router()
const got = require('got')
const auth = require('../auth')

//Behind the scenes the Client Credentials Grant is used to obtain the access_token and is by default cached for the duration of the returned expires_in value
let manager = new ManagementClient({
  domain: process.env.DOMAIN,
  clientId: process.env.CLIENTID,
  clientSecret: process.env.CLIENT_SECRET,
  scope: "create:users read:users read:user_idp_tokens update:users delete:users read:roles create:roles update:roles delete:roles"
})

//Behind the scenes the Client Credentials Grant is used to obtain the access_token and is by default cached for the duration of the returned expires_in value
let authenticator = new AuthenticationClient({
  domain: process.env.DOMAIN,
  clientId: process.env.CLIENTID
})

function isAdmin(user){
  let roles = {roles:[]}
  if(user[process.env.DUNBAR_ROLES_CLAIM]){
    roles = user[process.env.DUNBAR_ROLES_CLAIM].roles ?? {roles:[]}
  }
  return roles.includes(process.env.DUNBAR_ADMIN_ROLE)
}

/**
 * We trust this as our Auth0 server, because it's ours.
 * Ask our Dunbar Auth0 for an access token with user management scope.
 */ 
router.get('/getManagementToken', async function(req,res,next){
  let token = req.header("Authorization") ?? ""
  token = token.replace("Bearer ", "")
  authenticator.getProfile(token)
  .then(user =>{
      if(isAdmin(user)){
        manager.getAccessToken()
          .then(tok => {
            console.log("tok is")
            console.log(tok)
            res.status(200).send(tok)
          })
          .catch(err => {
            res.status(500).send(err)    
          })  
      }
      else{
        res.status(500).send("You are not an admin")  
      }
  })
  .catch(err => {
    res.status(500).send(err)
  })
})

/**
 * We trust this as our Auth0 server, because it's ours.
 * Ask our Dunbar Auth0 for a fresh access token with user management scope.
 * //FIXME!  The general access token or user should come in with this request.  Only fire if they are admin!
  manager.getAccessToken()
 */ 
router.get('/refreshManagementToken', async function(req,res,next){
  res.status(200).send("Nothing Yet")
})

/**
 * We trust this as our Auth0 server, because it's ours.
 * Tell our Dunbar Auth0 to assign the given user id to the Dunbar Public role.
 * This limits access token scope.
 * Other roles are removed.
 * //FIXME!  The general access token or user should come in with this request.  Only fire if they are admin!
  manager.getAccessToken()
 */ 
router.get('/assignPublicRole/:_id', async function(req,res,next){
    const params =  { "id" : req.params["_id"]}
    const data = { "roles" : [process.env.PUBLIC_ROLE_ID]}
    manager.users.assignRolesToUser(params, data)
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
     manager.users.assignRolesToUser(params, data, function (err, user) {
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
