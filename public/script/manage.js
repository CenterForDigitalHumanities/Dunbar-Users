#!/usr/bin/env node

const AUDIENCE = "https://cubap.auth0.com/api/v2/"
const CLIENTID = "z1DuwzGPYKmF7POW9LiAipO5MvKSDERM"
const DUNBAR_REDIRECT = origin+"/manage.html"
const DOMAIN = "cubap.auth0.com"
const DUNBAR_USER_ROLES_CLAIM = "http://dunbar.rerum.io/user_roles"
const DUNBAR_PUBLIC_ROLE = "dunbar_user_public"
const DUNBAR_CONTRIBUTOR_ROLE = "dunbar_user_contributor"
const DUNBAR_ADMIN_ROLE = "dunbar_user_admin"
const myURL = document.location.href
let authenticator = new auth0.Authentication({
    "domain":     DOMAIN,
    "clientID":   CLIENTID,
    "scope":"read:roles update:current_user_metadata name nickname picture email profile openid offline_access"
})
let webAuth = new auth0.WebAuth({
    "domain":       DOMAIN,
    "clientID":     CLIENTID,
    "audience":   AUDIENCE,
    "responseType" : "id_token token",
    "redirectUri" : DUNBAR_REDIRECT,
    "scope":"read:roles update:current_user_metadata name nickname picture email profile openid offline_access",
})
if(myURL.indexOf("access_token=") > -1){
    sessionStorage.setItem('Dunbar-Login-Token', getURLHash("access_token"))
}
//You can trust the token.  However, it may have expired.
if(sessionStorage.getItem("Dunbar-Login-Token")){
    //A token was in sessionStorage, so there was a login during this window session.
    //An access token from login is stored. Let's use it to get THIS USER's info.  If it fails, the user needs to login again.
    authenticator.userInfo(sessionStorage.getItem("Dunbar-Login-Token"), async function(err, u){
        if(err){
            console.error(err)
            sessionStorage.removeItem('Dunbar-Login-Token')
            alert("You logged out or your session expired.  Try logging in again.")
            stopHeartbeat()
            window.location = "login.html"
        }
        else{
            if(isAdmin(u)){
                startHeartbeat(webAuth)
                userList.innerHTML = ""
                userName.innerHTML = u.name ?? u.nickname ?? u.email
                let user_arr = await getAllUsers()
                for(let user of user_arr){
                    //This presumes they will only have one dunbar role here.  Make sure getAllUsers() accounts for that.
                    let role = user[DUNBAR_USER_ROLES_CLAIM].roles[0] ?? "Role Not Assigned"
                    role = role.replace("dunbar_user_", "")
                    role = role.charAt(0).toUpperCase() + role.slice(1)
                    //let elem = `<li user="${u.username}"><span class="info username">${user.username}</span>`
                    let elem = `<li user="${u.name}"><span class="info username">${user.name}</span>`
                    elem += `<span class="info role" userid="${user.user_id}"> : ${role}</span>`
                    let buttons = `
                        <div class="actions">
                            <input class="small roleBtn" type="button" value="Make Public" onclick="assignRole('${user.user_id}', 'Public')"/>
                            <input class="small roleBtn" type="button" value="Make Contributor" onclick="assignRole('${user.user_id}','Contributor')"/>
                        </div>
                    `
                    if(role !== "Admin"){
                        //Cannot demote an admin
                        elem += buttons    
                    }
                    elem +=`</li>`
                    userList.innerHTML += elem
                }       
            }
            else{
                //Then they are not an admin, but can view their profile page
                stopHeartbeat()
                alert("You do not have proper permissions to manage the Dunbar Apps' Users.  You will be sent to your profile.")
                window.location="profile.html"
            }
        }
    })
    history.replaceState(null, null, ' ');
}
else{
    //They need to log in!
    alert("You logged out or your session expired.  Try logging in again.")
    stopHeartbeat()
    window.location="login.html"
}

async function assignRole(userid, role){
    let url = `/dunbar-users/manage/assign${role}Role/${userid}`
    document.querySelectorAll(`.role[userid="${userid}"]`).forEach(elem => {
        elem.innerHTML = ` : Updating Role...`
    })
    fetch(url, {
        method: 'GET', 
        cache: 'default',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem("Dunbar-Login-Token")}`,
          'Content-Type' : "application/json; charset=utf-8"
        }
    })
    .then(resp => {
        document.querySelectorAll(`.role[userid="${userid}"]`).forEach(elem => {
            elem.innerHTML = ` : ${role}`
        })
    })
    .catch(err => {
        console.error("Role was not assigned")
        console.error(err)
        document.querySelectorAll(`.role[userid="${userid}"]`).forEach(elem => {
            elem.innerHTML = ` : Error`
        })
    })
}

/**
 * Auth0 redirects here with a bunch of info in hash variables.
 * This function allows you pull a single variable from the hash
 */  
function getURLHash(variable, url=document.location.href) {
    var query = url.substr(url.indexOf("#")+1)
    var vars = query.split("&")
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=")
        if (pair[0] == variable) { return pair[1] }
    }
    return false
}

/**
 * Use our Auth0 Server back end to ask for all the Dunbap Apps users.
 */ 
async function getAllUsers(){
     let users = await fetch("/dunbar-users/manage/getAllUsers", {
        "method" : "GET",
        "cache" : "no-store",
        "headers" :{
            "Authorization" : `Bearer ${sessionStorage.getItem("Dunbar-Login-Token")}`
        }
    })
    .then(resp => resp.json())
    .catch(err => {
        console.error("Error getting Users!!")
        console.error(err)
        return []
    })
    return users
}

function isAdmin(user){
    let roles = user[DUNBAR_USER_ROLES_CLAIM]?.roles ?? []
    return roles.includes(DUNBAR_ADMIN_ROLE)
}
