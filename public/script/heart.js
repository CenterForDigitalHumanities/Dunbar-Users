#!/usr/bin/env node
/**
 *  The heartbeat script.  This keeps access tokens fresh on the HTML pages, which keeps the user logged into a session on Auth0.
 *  @author Bryan Haberberger
 */  
let beat = false

function startHeartbeat(webAuth){
  //Auth0 Heartbeat that keeps the access token fresh.
    beat = setInterval(async function(){
      console.log("beat...")
      if(sessionStorage.getItem("Dunbar-Token")){
        console.log("token")
        webAuth.checkSession({
          "audience": 'https://cubap.auth0.com/api/v2/',
          "scope":"create:users read:users read:user_idp_tokens update:users delete:users read:roles create:roles update:roles delete:roles profile openid offline_access",
          "responseType" : "token",
        }, function (err, authResult) {
          // err if automatic parseHash fails
          if(err){
            console.log("Check Session error")
            console.error(e)
            sessionStorage.removeItem("Dunbar-Token")
            sessionStorage.removeItem("Agent-URI") 
            sessionStorage.removeItem("Dunbar-User")
            stopHeartbeat()
          }
          else{
            sessionStorage.setItem("Dunbar-Token", authResult.access_token)
          }
        })
      }
      else{
        console.log("login plz")
        //You need to login to start a session!
      }
    }, 25000)
}

function stopHeartbeat(){
  clearInterval(beat)
}
