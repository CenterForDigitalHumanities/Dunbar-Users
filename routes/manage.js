#!/usr/bin/env node

const ManagementClient = require('auth0').ManagementClient
const AuthenticationClient = require('auth0').AuthenticationClient
const express = require('express')
const router = express.Router()
const got = require('got')
const auth = require('../auth')

let manager = new ManagementClient({
  domain: process.env.DOMAIN,
  clientId: process.env.CLIENTID,
  clientSecret: process.env.CLIENT_SECRET,
  scope: "create:users read:users read:user_idp_tokens update:users delete:users read:roles create:roles update:roles delete:roles"
})

let authenticator = new AuthenticationClient({
  domain: process.env.DOMAIN,
  clientId: process.env.CLIENTID
})


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
 * Tell our Dunbar Auth0 to assign the given user id to the Dunbar Public role.
 * This limits access token scope.
 * Other roles are removed.
 */ 
router.get('/assignPublicRole/:_id', async function(req,res,next){
  let token = req.header("Authorization") ?? ""
  token = token.replace("Bearer ", "")
  authenticator.getProfile(token)
  .then(user =>{
      if(isAdmin(user)){
        let params =  { "id" : process.env.DUNBAR_PUBLIC_ROLE_ID}
        let data = { "users" : [req.params._id]}
        manager.users.assignUsersToRole(params, data)
        .then(resp => {
          if(resp.ok){
            //unassign from other roles
            params = {"id" : req.params._id}
            data = { "roles" : [process.env.DUNBAR_CONTRIBUTOR_ROLE_ID, process.env.DUNBAR_ADMIN_ROLE_ID]}
            manager.users.removeRolesFromUser(params, data)
            .then(resp2 =>{
              if(resp2.ok){
                res.status(200).send("Public role was successfully assinged to the user")
              }
              else{
                res.status(500).send("Internal error assigning role to use")
              }
            })
            .catch(err => {
              res.status(500).send(err)  
            })  
          }
          else{
            res.status(500).send("Internal error assigning role to user")
          }
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
 * Tell our Dunbar Auth0 to assign the given user id to the Dunbar Public role.
 * This limits access token scope.
 * Other roles are removed.
 */ 
router.post('/addUserToDunbar', async function(req,res,next){
  let token = req.header("Authorization") ?? ""
  token = token.replace("Bearer ", "")
  authenticator.getProfile(token)
  .then(async function(user){
      if(isAdmin(user)){
        let test = {
          nickname: 'bryn',
          name: 'bry@dunbar.io',
          picture: 'https://s.gravatar.com/avatar/fc39f4f5b1c3381abe2ef2d25e79af3d?s=480&r=pg&d=https%3A%2F%2Fcenterfordigitalhumanities.github.io%2Frerum-consortium%2Flogo.png',
          app_metadata:{
            "agent" : "http://test.rerum.io/testing",
            "app" : "dla"
          }
        }
        let user = await management.createUser(test)
        res.status(200).json(user)
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
 * Tell our Dunbar Auth0 to assign the given user id to the Dunbar Public role.
 * This limits access token scope.
 * Other roles are removed.
 */ 
router.post('/removeUserFromDunbar', async function(req,res,next){
  let token = req.header("Authorization") ?? ""
  token = token.replace("Bearer ", "")
  authenticator.getProfile(token)
  .then(user =>{
      if(isAdmin(user)){

      }
      else{
        res.status(500).send("You are not an admin")  
      }
  })
  .catch(err => {
    res.status(500).send(err)
  })
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

function isAdmin(user){
  let roles = {roles:[]}
  if(user[process.env.DUNBAR_ROLES_CLAIM]){
    roles = user[process.env.DUNBAR_ROLES_CLAIM].roles ?? {roles:[]}
  }
  return roles.includes(process.env.DUNBAR_ADMIN_ROLE)
}

module.exports = router
