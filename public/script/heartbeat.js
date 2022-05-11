#!/usr/bin/env node

/**
 * Note that all of this is fresh upon entering the page with a good login token.
 * Instead of a timer, we can refresh these upon page focus/action
 * It depends how quick tokens will die.
 */

let login_beat = null
function startHeartbeat(webAuth) {
    login_beat = setInterval(heartbeat(webAuth), 60000 * 4.5) // These tokens expire every 5 Mins
    return heartbeat(webAuth)
}

function stopHeartbeat() {
    if (login_beat != undefined) {
        clearInterval(login_beat)
    }
}

async function heartbeat(webAuth) {
    try {
        webAuth.checkSession({}, (err2, result) => {
            if (err2) {
                console.error(err2)
                localStorage.removeItem('Dunbar-Login-Token')
                stopHeartbeat()
                webAuth.authorize({ authParamsMap: { 'app': 'dla' } })
                return
            }
            localStorage.setItem("Dunbar-Login-Token", result.accessToken)
            localStorage.setItem("userToken", result.idToken)
            if(username){
                username.innerHTML = u.name ?? u.nickname ?? u.email
            }
            window.DLA_USER = result.idTokenPayload
            window.DLA_USER.authorization = result.accessToken
        })
    } catch(_err){
        // auth0 err
    }
}
