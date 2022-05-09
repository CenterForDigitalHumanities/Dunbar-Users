#!/usr/bin/env node

/**
 * Note that all of this is fresh upon entering the page with a good login token.
 * Instead of a timer, we can refresh these upon page focus/action
 * It depends how quick tokens will die.
 */ 

login_beat = null
function startHeartbeat(webAuth){
    login_beat = setInterval(async function(){
        if(localStorage.getItem("Dunbar-Login-Token")){
            authenticator.userInfo(localStorage.getItem("Dunbar-Login-Token"), async function(err1, u){
                if(err1){
                    console.error(err1)
                    localStorage.removeItem('Dunbar-Login-Token')
                    alert("You logged out of Dunbar Apps or your session expired.  Try logging in again.")
                    stopHeartbeat()
                    window.location = "login.html"
                }
                else{
                    webAuth.checkSession({}, (err2, result) => {
                        if(err2) {
                            console.error("Could not get new login token, checkSession() failure.  You need to login again.")
                            console.error(err2)
                            localStorage.removeItem('Dunbar-Login-Token')
                            stopHeartbeat()
                            window.location = "login.html"
                        }
                        else{
                            localStorage.setItem("Dunbar-Login-Token", result.accessToken)
                        }
                    })
                }
            })
        }
        else{
            console.error("There is no login token for the heartbeat.  Login plz")
            window.location = "login.html"
            //You need to login to start a session!
        }
    }, 60000 * 4.5) // These tokens expire every 5 Mins
}

function stopHeartbeat(){
    if(login_beat !== null && login_beat !== undefined){
        clearInterval(login_beat)
    }
}
