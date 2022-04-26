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

router.get('/getManagementToken', async function(req,res,next){
  let token = await auth0.getAccessToken()
  res.status(200).send(token)
})

router.get('/refreshManagementToken', async function(req,res,next){
  res.status(200).send("Nothing Yet")
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
