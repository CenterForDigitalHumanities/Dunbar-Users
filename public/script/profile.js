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
    "scope":"read:roles update:current_user_metadata read:current_user name nickname picture email profile openid offline_access"
})

let webAuth = new auth0.WebAuth({
    "domain":       DOMAIN,
    "clientID":     CLIENTID,
    "audience":   AUDIENCE,
    "responseType" : "token",
    "redirectUri" : DUNBAR_REDIRECT,
    "scope":"read:roles update:current_user_metadata read:current_user name nickname picture email profile openid offline_access"
})

let manager = {}

//You can trust the token.  However, it may have expired.
if(localStorage.getItem("Dunbar-Login-Token")){
    //An access token from login is stored. Let's use it to get THIS USER's info.  If it fails, the user needs to login again.
    authenticator.userInfo(localStorage.getItem("Dunbar-Login-Token"), async function(err, u){
        if(err){
            console.error(err)
            localStorage.removeItem('Dunbar-Login-Token')
            alert("You logged out or your session expired.  Try logging in again.")
            stopHeartbeat()
            window.location="login.html"
        }
        else{
            startHeartbeat(webAuth)
            manager = new auth0.Management({
              domain: DOMAIN,
              token: localStorage.getItem("Dunbar-Login-Token")
            })
            userName.innerHTML = u.name ?? u.nickname ?? u.email
            //Populate know information into the form inputs.
            for(let prop in u){
                try{
                    document.querySelector(`input[name='${prop}']`)?.setAttribute('value',u[prop])
                    document.querySelector(`[data-${prop}]`)?.setAttribute(`data-${prop}`,u[prop])
                } catch (err) {}
            }
            document.querySelector(`[data-picture]`).innerHTML = `<img src="${u.picture}"/>`
            const form = document.getElementById('userForm')
            form.addEventListener('submit', (e) =>{
                updateUserInfo(e, u.sub)
            })
        }
    })
}
else{
    //They need to log in!
    alert("You logged out or your session expired.  Try logging in again.")
    stopHeartbeat()
    window.location="login.html"
}

/**
 * ALLOWED FIELDS
    app_metadata
    blocked
    email
    email_verified
    family_name
    given_name
    name
    nickname
    password
    phone_number
    phone_verified
    picture
    username
    user_metadata
    verify_email
 * OUR SCOPES
    update:current_user_metadata 
    name
    nickname
    username
    picture
    email
    profile
    openid
    offline_access
 */ 

/*
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
        if(updateUser.user_id){
            alert("User Info Updated!")
        }
        else{
            alert("User Info Update Failed!")
        }
    }
}
*/

async function updateUserInfo(event, userid){
    event.preventDefault()
    let params = { id: userid }    
    let info = new FormData(event.target)
    let data = Object.fromEntries(info.entries())
    for(let prop in data){
        if(data[prop] === "" || data[prop] === null || data[prop] === undefined){
            delete data[prop]
        }
    }
    manager.patchUserAttributes(userid, data, (err, user) => {
        if(err){
            console.error("Update Failed!")
            console.error(err)
        }
        else{
            console.log("User Updated!")
            console.log(user)        
        }
        
    })
}
