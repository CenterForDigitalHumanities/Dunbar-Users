//Note that all of this is fresh upon entering the page with a good login token.
//Instead of a timer, we can refresh these upon page focus/action
//It depends how often our tokens will die.  At 30 seconds, we should have this.  If it lasts for hours, then we don't need this.
function startHeartbeat(webAuth){
    login_beat = setInterval(async function(){
        if(sessionStorage.getItem("Dunbar-Login-Token")){
            authenticator.userInfo(sessionStorage.getItem("Dunbar-Login-Token"), async function(err1, u){
                if(err1){
                    console.error(err1)
                    sessionStorage.removeItem('Agent-URI')
                    sessionStorage.removeItem('Dunbar-Login-Token')
                    clearInterval(login_beat)
                    agentLink.innerHTML = "Please login again.  Your session expired."
                    alert("You logged out or your session expired.  Try logging in again.")
                }
                else{
                    webAuth.checkSession({}, (err2, result) => {
                        if(err2) {
                            console.error("Could not get new login token, checkSession() failure.  You need to login again.")
                            console.error(err2)
                            sessionStorage.removeItem('Agent-URI')
                            sessionStorage.removeItem('Dunbar-Login-Token')
                            clearInterval(login_beat)
                            agentLink.innerHTML = "Please login again.  checkSession() failure"
                        }
                        else{
                            sessionStorage.setItem("Dunbar-Login-Token", result.accessToken)
                        }
                    })
                }
            })
        }
        else{
            console.error("There is no login token for the heartbeat.  Login plz")
            //You need to login to start a session!
        }
    }, 60000 * 4.5) // These tokens expire every 5 Mins
}

function stopHeartbeat(){
    clearInterval(login_beat)
}