#!/usr/bin/env node

const ManagementClient = require('auth0').ManagementClient
const AuthenticationClient = require('auth0').AuthenticationClient
const express = require('express')
const router = express.Router()
const got = require('got')

const ROLES = [
  process.env.ROLE_CURATOR_ID,
  process.env.ROLE_REVIEWER_ID,
  process.env.ROLE_CONTRIBUTOR_ID,
  process.env.ROLE_PUBLIC_ID
].map(str => str.split(' ')[0])

let manager = new ManagementClient({
  domain: process.env.DOMAIN,
  clientId: process.env.CLIENTID,
  clientSecret: process.env.CLIENT_SECRET,
  scope: "create:users read:users read:user_idp_tokens update:users delete:users read:roles create:roles update:roles delete:roles"
})

let authenticator = new AuthenticationClient({
  domain: process.env.DOMAIN,
  clientId: process.env.CLIENTID
})

// /**
//  * Let Dunbar Apps Users update THEIR OWN profile info.
//  * 
//  * Make sure the user making the request is the user to update.
//  */
// router.put('/updateProfileInfo', async function (req, res, next) {
//   console.log("update profile info")
//   let token = req.header("Authorization") ?? ""
//   token = token.replace("Bearer ", "")
//   if (token) {
//     authenticator.getProfile(token)
//       .then(async (current_user) => {
//         if (isDunbarUser(current_user)) {
//           //The user object is in the body, and the id is present or fail.
//           let userObj = req.body ?? {}
//           const userid = userObj.sub ?? userObj.user_id ?? userObj.id ?? ""
//           delete userObj.sub
//           delete userObj.user_id
//           delete userObj.id
//           if (userid) {
//             if (current_user.sub === userid) {
//               let params = { id: current_user.sub }
//               manager.updateUser(params, userObj)
//                 .then(user => {
//                   res.status(200).json(user)
//                 })
//                 .catch(err => {
//                   console.error("Trouble updating using profile.")
//                   console.error(err)
//                   res.status(500).send(err)
//                 })
//             }
//             else {
//               res.status(401).send("You can only update your own profile.  Please check the id of the user in the request body.")
//             }
//           }
//           else {
//             res.status(400).send("The user object was not JSON or did not have an id.")
//           }
//         }
//         else {
//           res.status(401).send("You are not a Dunbar Apps user, this API is not for you.")
//         }
//       })
//       .catch(err => {
//         res.status(500).send(err)
//       })
//   }
//   else {
//     res.status(403).send("You must be a Dunbar Apps user.  Please provide an access token in the Authorization header.")
//   }
// })

/**
 * Get all the users from the Auth0 Tenant with app "dla".
 */
router.get('/getAllUsers', async function (req, res, next) {
  let token = req.header("Authorization") ?? ""
  token = token.replace("Bearer ", "")
  try {
    authenticator.getProfile(token)
      .then(async (current_dunbar_users) => {
        if (!isAdmin(current_dunbar_users)) {
          res.status(403).send("You are not an admin")
          return
        }

        const fetchUsersInRoles = ROLES.map(id => manager.getUsersInRole({ id }))
        return Promise.all(fetchUsersInRoles)
          .then(userGroups => {
            const roleNames = [
              "curator",
              "reviewer",
              "contributor",
              "public"
            ]
            res.json(userGroups.map((group, index) => group.map(user => {
              user.role = roleNames[index]
              return user
            })).flat())
            return
          })
          .catch(err => {
            console.error("Error getting users in back end")
            res.status(500).send(err)
          })
      })
      .catch(err => {
        res.status(500)
        next(err)
      })
  } catch (err) {
    next(err)
    return
  }
})

/**
 * Tell our Dunbar Auth0 to assign the given user id to the Dunbar Public role.
 * This limits access token scope.
 * Other roles are removed.
 */
router.post('/assignRole', async function (req, res, next) {
  const token = (req.header("Authorization") ?? "")?.replace("Bearer ", "")
  const { userid, role } = req.body
  const roleID = process.env[`ROLE_${String(role).toUpperCase()}_ID`]

  // Guards
  if (role === 'admin') {
    res.status(501).send("No changing Admin roles here")
  }
  if (!userid || !roleID) {
    res.status(406).send("Failed to provide data for assignment")
    return
  }

  // Confirm Admin
  authenticator.getProfile(token)
    .then(user => {
      if (!isAdmin(user)) {
        res.status(403).send("Unable to authorize request by non-administrator")
        return
      }

      manager.assignRolestoUser({ id: userid }, { roles: [roleID] })
        .then(result => {
          // Super odd. On success, the response is an empty string...
          // unassign from other Dunbar roles
          const dataObj = { roles: ROLES.filter(justAdded => justAdded !== roleID) }

          manager.removeRolesFromUser({ id: userid }, dataObj)
            .then(resp2 => {
              res.status(200).send(`${role[0].toUpperCase()}${role.substr(1)} role was successfully assigned to the user`)
            })
            .catch(err => {
              res.status(500).send(err)
            })
        })
        .catch(err => {
          res.status(500).send(err)
        })
    })
    .catch(err => {
      res.status(401).send("Unable to authenticate request")
    })
})

/**
 * The URL hash from the authorize endpoint looks like #access_token=...&scope=...&
 * Pass in the URL with the hash and the variable to grab.
 * The value for that variable is returned.
 */
function getURLHash(variable, url) {
  var query = url.substr(url.indexOf("#") + 1)
  var vars = query.split("&")
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=")
    if (pair[0] == variable) { return pair[1] }
  }
  return false
}

/**
 *  Given a user profile, check if that user is a Dunbar Apps admin.
 */
function isAdmin(user) {
  let roles = { roles: [] }
  if (user[process.env.DUNBAR_ROLES_CLAIM]) {
    roles = user[process.env.DUNBAR_ROLES_CLAIM].roles ?? { roles: [] }
  }
  return roles.includes("dunbar_user_admin")
}

/**
 *  Given a user profile, check if that user belongs to a Dunbar App.
 */
function isDunbarUser(user) {
  return (
    user[process.env.DUNBAR_APP_CLAIM] &&
    user[process.env.DUNBAR_APP_CLAIM] === "dla"
  )
}

module.exports = router
