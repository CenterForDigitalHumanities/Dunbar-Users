#!/usr/bin/env node

const AUDIENCE = "https://cubap.auth0.com/api/v2/"
const CLIENTID = "z1DuwzGPYKmF7POW9LiAipO5MvKSDERM"
const DUNBAR_REDIRECT = origin + "/manage.html"
const DOMAIN = "cubap.auth0.com"
const DUNBAR_USER_ROLES_CLAIM = "http://dunbar.rerum.io/user_roles"
const DUNBAR_PUBLIC_ROLE = "dunbar_user_public"
const DUNBAR_CONTRIBUTOR_ROLE = "dunbar_user_contributor"
const DUNBAR_ADMIN_ROLE = "dunbar_user_admin"
const myURL = document.location.href
let authenticator = new auth0.Authentication({
    "domain": DOMAIN,
    "clientID": CLIENTID,
    "scope": "read:roles update:current_user_metadata read:current_user name nickname picture email profile openid offline_access"
})
const webAuth = new auth0.WebAuth({
    "domain": DOMAIN,
    "clientID": CLIENTID,
    "audience": AUDIENCE,
    "responseType": "id_token token",
    "redirectUri": DUNBAR_REDIRECT,
    "scope": "read:roles update:current_user_metadata read:current_user name nickname picture email profile openid offline_access",
})
if (myURL.indexOf("access_token=") > -1) {
    localStorage.setItem('Dunbar-Login-Token', getURLHash("access_token"))
}
startHeartbeat(webAuth).then(_success => adminOnly(localStorage.getItem('Dunbar-Login-Token')))

function adminOnly(token) {
    //You can trust the token.  However, it may have expired.
    //A token was in localStorage, so there was a login during this window session.
    //An access token from login is stored. Let's use it to get THIS USER's info.  If it fails, the user needs to login again.
    authenticator.userInfo(token, async (err, u) => {
        if (err) {
            localStorage.removeItem('Dunbar-Login-Token')
            webAuth.authorize({
                "authParamsMap": { 'app': 'dla' },
                "scope": "read:roles update:current_user_metadata read:current_user name nickname picture email profile openid offline_access",
                "redirectUri": DUNBAR_REDIRECT,
                "responseType": "id_token token"
            })
            return
        }
        if (isAdmin(u)) {
            userList.innerHTML = ""
            userName.innerHTML = u.name ?? u.nickname ?? u.email
            const user_arr = await getAllUsers()
            let elem = ``
            for (let user of user_arr) {
                //This presumes they will only have one dunbar role here.  Make sure getAllUsers() accounts for that.
                const role = user[DUNBAR_USER_ROLES_CLAIM]?.roles[0]?.replace("dunbar_user_", "") ?? "Role Not Assigned"
                elem += `<li user="${u.name}">${user.name}
                <em class="role" userid="${user.user_id}"> : ${role}</em>`
                if (role !== "Admin") {
                    elem += `<div class="actions">
                            <input class="tag is-small "bg-primary" 
                                type="button" 
                                value="Make ${role === "public" ? "Contributor" : "Public"}" 
                                onclick="assignRole('${user.user_id}','${role === "public" ? 'Contributor' : 'Public'}')"/>
                        </div>`
                }
                elem += `</li>
                `
            }
            userList.innerHTML += elem
        }
        else {
            //Then they are not an admin, but can view their profile page
            alert("Access limited to project administrators. Redirecting to profile page.")
            window.location = "profile.html"
        }
    })
    history.replaceState(null, null, ' ')
}

async function assignRole(userid, role) {
    let url = `/dunbar-users/manage/assign${role}Role/${userid}`
    document.querySelectorAll(`.role[userid="${userid}"]`).forEach(elem => {
        elem.innerHTML = ` : Updating Role...`
    })
    fetch(url, {
        method: 'GET',
        cache: 'default',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem("Dunbar-Login-Token")}`,
            'Content-Type': "application/json; charset=utf-8"
        }
    })
        .then(_resp => {
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
function getURLHash(variable, urlString = document.location.href) {
    const url = new URL(urlString)
    var vars = new URLSearchParams(url.hash.substring(1))
    return vars.get(variable) ?? false
}

/**
 * Use our Auth0 Server back end to ask for all the Dunbap Apps users.
 */
async function getAllUsers() {
    return fetch("/dunbar-users/manage/getAllUsers", {
        "method": "GET",
        "cache": "no-store",
        "headers": {
            "Authorization": `Bearer ${localStorage.getItem("Dunbar-Login-Token")}`
        }
    })
        .then(resp => resp.json())
        .catch(err => {
            console.error("Error getting Users!!")
            console.error(err)
            return []
        })
}

function isAdmin(user) {
    return user[DUNBAR_USER_ROLES_CLAIM]?.roles.includes(DUNBAR_ADMIN_ROLE)
}
