const AUDIENCE = "https://cubap.auth0.com/api/v2/"
const CLIENTID = "z1DuwzGPYKmF7POW9LiAipO5MvKSDERM"
const DUNBAR_REDIRECT = "https://dunbar-users.herokuapp.com/dunbar-users/manage.html"
const DOMAIN = "cubap.auth0.com"
const DUNBAR_USER_ROLES_CLAIM = "http://dunbar.rerum.io/user_roles"
const DUNBAR_PUBLIC_ROLE = "dunbar_user_public"
const DUNBAR_CONTRIBUTOR_ROLE = "dunbar_user_contributor"
const DUNBAR_ADMIN_ROLE = "dunbar_user_admin"
const myURL = document.location.href
let agent = sessionStorage.getItem("Agent-URI")
let token = sessionStorage.getItem("Dunbar-Login-Token")

let webAuth = new auth0.WebAuth({
    "domain":       DOMAIN,
    "clientID":     CLIENTID,
    "audience":   AUDIENCE,
    "responseType" : "token",
    "redirectUri" : DUNBAR_REDIRECT,
    "scope":"profile openid offline_access",
})

//Should only be able to update their own user info, no need to access our auth0 server.  Treat this as just a client.
let manager = {}

//You can trust the token.  However, it may have expired.
if(sessionStorage.getItem("Dunbar-Login-Token")){
    //A token was in sessionStorage, so there was a login during this window session.
    //An access token from login is stored. Let's use it to get THIS USER's info.  If it fails, the user needs to login again.
    authenticator.userInfo(sessionStorage.getItem("Dunbar-Login-Token"), async function(err, u){
        if(err){
            console.error(err)
            sessionStorage.removeItem('Agent-URI')
            sessionStorage.removeItem('Dunbar-Login-Token')
            clearInterval(login_beat)
            agentLink.innerHTML = "Please login again.  Your session expired."
            alert("You logged out or your session expired.  Try logging in again.")
        }
        else{
            startHeartbeat(webAuth)
            //Establish the manager they can use to update their own info (needs a login token)
            manager = new auth0.Management({
              domain: DOMAIN,
              token: sessionStorage.getItem("Dunbar-Login-Token")
            })
            //You have the profile information.  Put the current information into the exposed form.
            let a = u["http://store.rerum.io/agent"]
            agentLink.innerHTML = a
            sessionStorage.setItem('Agent-URI', a)
        }
    })
}
else{
    //They need to log in!
    alert("You logged out or your session expired.  Try logging in again.")
    document.location.href="login.html"
}

async function changeUsername(userid, role){

}

async function changeEmail(userid, role){

}

async function changePassword(userid, role){

}