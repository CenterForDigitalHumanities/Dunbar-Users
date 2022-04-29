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
router.get('/getAllUsers', async function(req,res,next){
  let token = req.header("Authorization") ?? ""
  token = token.replace("Bearer ", "")
  authenticator.getProfile(token)
  .then(async (current_dunbar_users) => {
      if(isAdmin(current_dunbar_users)){
          let filter = {
            "q":`app_metadata.app:"dla"`
          }
          let usersWithRoles = await manager.getUsers(filter)
          .then(async (allUsers) => {
             let mappedUsers = await Promise.all(allUsers.map(async (u) => {
              let roles = await manager.getUserRoles({"id":u.user_id})
              .then(roles => {
                let r = {"roles": []}
                if(roles && roles.length) {
                  //Only consider the dunbar roles, filter out others
                  r.roles = roles
                    .filter(roleObj => roleObj.name.includes("dunbar_user"))
                    .map(roleObj => roleObj.name)
                }
                u[process.env.DUNBAR_ROLES_CLAIM] = r
              })
              .catch(err => {
                  //Could not get user roles.
                  console.error(err)
                  return []
              })
              return u 
            }))
            return mappedUsers
          })
          .catch(err => {
            console.error("Error getting users in back end")
            console.error(err)
            res.status(500).send(err)    
          })  
          res.status(200).json(usersWithRoles)
      }
      else{
        res.status(401).send("You are not an admin")  
      }
  })
  .catch(err => {
    res.status(500).send(err)
  })
})


/**
 * We trust this as our Auth0 server, because it's ours.
 * Ask our Dunbar Auth0 for an access token with user management scope.
 */ 
router.get('/getManagementToken', async function(req,res,next){
  res.status(501).send("We don't expose this.")
  /*
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
  */
})

/**
 * We trust this as our Auth0 server, because it's ours.
 * We don't trust the user.  Confirm the user is an admin through the back end before allowing this.
 * 
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
        manager.assignUsersToRole(params, data)
        .then(resp => {
            //unassign from other Dunbar roles
            params = {"id" : req.params._id}
            data = { "roles" : [process.env.DUNBAR_CONTRIBUTOR_ROLE_ID, process.env.DUNBAR_ADMIN_ROLE_ID]}
            manager.removeRolesFromUser(params, data)
            .then(resp2 =>{
                res.status(200).send("Public role was successfully assinged to the user")
            })
            .catch(err => {
              res.status(500).send(err)  
            })  
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
 * We don't trust the user.  Confirm the user is an admin through the back end before allowing this.
 * 
 * Tell our Dunbar Auth0 to assign the given user id to the Dunbar Contributor role.
 * This limits access token scope.
 * Other roles are removed.
 */ 
router.get('/assignContributorRole/:_id', async function(req,res,next){
let token = req.header("Authorization") ?? ""
  token = token.replace("Bearer ", "")
  authenticator.getProfile(token)
  .then(user =>{
      if(isAdmin(user)){
        let params =  { "id" : process.env.DUNBAR_CONTRIBUTOR_ROLE_ID}
        let data = { "users" : [req.params._id]}
        manager.assignUsersToRole(params, data)
        .then(resp => {
            //unassign from other Dunbar roles
            params = {"id" : req.params._id}
            data = { "roles" : [process.env.DUNBAR_PUBLIC_ROLE_ID, process.env.DUNBAR_ADMIN_ROLE_ID]}
            manager.removeRolesFromUser(params, data)
            .then(resp2 =>{
                res.status(200).send("Contributor role was successfully assinged to the user")
            })
            .catch(err => {
              res.status(500).send(err)  
            })  
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
 * We don't trust the user.  Confirm the user is an admin through the back end before allowing this.
 * 
 * Tell our Dunbar Auth0 to assign the given user id to the Dunbar Admin role.
 * Other roles are removed.
 */ 
router.post('/assignAdminRole/:_id', async function(req,res,next){
  res.status(501).send("We don't expose this.")
  /*
  let token = req.header("Authorization") ?? ""
  token = token.replace("Bearer ", "")
  authenticator.getProfile(token)
  .then(user =>{
      if(isAdmin(user)){
        let params =  { "id" : process.env.DUNBAR_ADMIN_ROLE_ID}
        let data = { "users" : [req.params._id]}
        manager.assignUsersToRole(params, data)
        .then(resp => {
            //unassign from other Dunbar roles
            params = {"id" : req.params._id}
            data = { "roles" : [process.env.DUNBAR_CONTRIBUTOR_ROLE_ID, process.env.DUNBAR_PUBLIC_ROLE_ID]}
            manager.removeRolesFromUser(params, data)
            .then(resp2 =>{
                res.status(200).send("Admin role was successfully assinged to the user")
            })
            .catch(err => {
              res.status(500).send(err)  
            })  
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
  */
})

/**
 * We need to establish a new management client for this with the users login-token-scope
 * That manager will allow them to update their own profile info, and no one else's.
 * 
 */ 
router.post('/updateOwnProfileInfo', async function(req,res,next){
  let token = req.header("Authorization") ?? ""
  token = token.replace("Bearer ", "")
  authenticator.getProfile(token)
  .then(user =>{
    let params =  { "id" : process.env.DUNBAR_CONTRIBUTOR_ROLE_ID}
    let data = { "users" : [req.params._id]}
    manager.assignUsersToRole(params, data)
    .then(resp => {
        //unassign from other Dunbar roles
        params = {"id" : req.params._id}
        data = { "roles" : [process.env.DUNBAR_PUBLIC_ROLE_ID, process.env.DUNBAR_ADMIN_ROLE_ID]}
        manager.removeRolesFromUser(params, data)
        .then(resp2 =>{
            res.status(200).send("Contributor role was successfully assinged to the user")
        })
        .catch(err => {
          res.status(500).send(err)  
        })  
    })
    .catch(err => {
      res.status(500).send(err)  
    })
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
