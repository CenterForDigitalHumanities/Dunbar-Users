#!/usr/bin/env node

const AUDIENCE = "https://cubap.auth0.com/api/v2/"
const CLIENTID = "z1DuwzGPYKmF7POW9LiAipO5MvKSDERM"
const DUNBAR_REDIRECT = "http://localhost:3000/dunbar-users/manage.html"
const DOMAIN = "cubap.auth0.com"
const DUNBAR_USER_ROLES_CLAIM = "http://dunbar.rerum.io/user_roles"
const DUNBAR_PUBLIC_ROLE = "dunbar_user_public"
const DUNBAR_CONTRIBUTOR_ROLE = "dunbar_user_contributor"
const DUNBAR_ADMIN_ROLE = "dunbar_user_admin"
const myURL = document.location.href

/**
 * Solely for getting the user profile.
 */ 
let authenticator = new auth0.Authentication({
    "domain":     DOMAIN,
    "clientID":   CLIENTID,
    "scope":"read:roles update:current_user_metadata read:current_user name nickname picture email profile openid offline_access"
})

/**
 * This is for the heartbeat.
 */ 
let webAuth = new auth0.WebAuth({
    "domain":       DOMAIN,
    "clientID":     CLIENTID,
    "audience":   AUDIENCE,
    "responseType" : "id_token token",
    "redirectUri" : DUNBAR_REDIRECT,
    "scope":"read:roles update:current_user_metadata read:current_user name nickname picture email profile openid offline_access"
})

/**
 * You can trust the token.  However, it may have expired.
 * It is an access token from an authorize flow.
 * Use it to get the user profile (which also checks that you are logged in with a session)
 * If this is a Dunbar Apps user, then they will be able to update their own profile information.
 */ 
if(localStorage.getItem("Dunbar-Login-Token")){
    //An access token from login is stored. Let's use it to get THIS USER's info.  If it fails, the user needs to login again.
    authenticator.userInfo(localStorage.getItem("Dunbar-Login-Token"), async function(err, u){
        if(err){
            console.error(err)
            localStorage.removeItem('Dunbar-Login-Token')
            alert("You logged out of Dunbar Apps or your session expired.  Try logging in again.")
            window.location="login.html"
        }
        else{
            startHeartbeat(webAuth)
            userName.innerHTML = u.name ?? u.nickname ?? u.email
            //Populate know information into the form inputs.
            for(let prop in u){
                let textfield = document.querySelector(`input[name='${prop}']`)
                if(textfield){
                    textfield.value = u[prop]
                }
            }
            const form = document.getElementById('userForm')
            form.addEventListener('submit', (e) =>{
                updateUserInfo(e, u.sub)
            })
        }
    })
}
else{
    //They need to log in!
    alert("You logged out of Dunbar Apps or your session expired.  Try logging in again.")
    window.location="login.html"
}

/**
 * PUT to the dunbar-users back end.
 * You must supply your login token in the Authorization header.
 * The body needs to be a user object, and you need to supply the user id in the body.
 * You can only update the user info belonging to the user encoded on the token in the Authorization header
 * This means you can only do this to update "your own" profile information.
 */ 
async function updateUserInfo(event, userid){
    event.preventDefault()
    let info = new FormData(event.target)
    let data = Object.fromEntries(info.entries())
    for(let prop in data){
        if(data[prop] === "" || data[prop] === null || data[prop] === undefined){
            delete data[prop]
        }
    }
    data.user_id = userid
    if(confirm("Really submit these profile changes?")){
        let updatedUser = await fetch("/dunbar-users/manage/updateProfileInfo",{
            method: 'PUT', 
            cache: 'default',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem("Dunbar-Login-Token")}`,
              'Content-Type' : "application/json; charset=utf-8"
            },
            body:JSON.stringify(data)
        })
        .then(r => r.json())
        .catch(err => {
            console.error("User Not Updated")
            console.error(err)
            return {}
        })    
        if(updatedUser.user_id){
            alert("User Info Updated!")
        }
        else{
            alert("User Info Update Failed!")
        }
    }
}
