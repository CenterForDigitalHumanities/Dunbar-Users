#!/usr/bin/env node
/**
 *  The heartbeat script.  This keeps access tokens fresh on the HTML pages, which keeps the user logged into a session on Auth0.
 *  @author Bryan Haberberger
 */  

function startHeartbeat(){
  /** Auth0 Heartbeat that keeps the access token fresh. Apps' responsibility.*/
    beat = setInterval(async function(){
      console.log("beat...")
      if(sessionStorage.getItem("Dunbar-Token")){
        console.log("token")
        //You are registered/logged in but you access token has expired b/c it has a short life.  Silently refresh it if possible.
        try{
          let resp = await fetch("/client/revalidate").then(res=>res.json()).catch(err=>{return err})
          resp = JSON.parse(resp)
          let t = resp.access_token ?? ""
          if(t){
            //This user has continued their session, we we got a new token and can store it
            console.log("Set token in session storage")
            sessionStorage.setItem("Dunbar-Token", t)  
          }
          else{
            //The user is logged out or did not continue their session, and so needs to log in again.
            //console.log("No access token in start heartbeat")
            sessionStorage.removeItem("Dunbar-Token")
            sessionStorage.removeItem("Agent-URI") 
            console.log("Could not authorize silently.  Please login again.")
            stopHeartbeat()
            console.error(resp)
            //document.location.href = "login.html"
          }
        }
        catch (e) {
          //The authorize endpoint errored out and we could not validate you.  Please login again.
          console.log("got to authorize error")
          console.error(e)
          sessionStorage.removeItem("Dunbar-Token")
          sessionStorage.removeItem("Agent-URI")
          stopHeartbeat()
        }
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
