/**
 * read user's github config
 */

const exec = require('child_process').execSync
const logSymbols = require('log-symbols')

module.exports = function () {
    let userName, userEmail

    try {
        userName = exec('git config --get user.name')
        userEmail = exec('git config --get user.email')
    } catch (e) {
        logSymbols.error(`got github config error: ${e.message}`)
    }

    userName = userName && JSON.stringify(userName.toString().trim()).slice(1, -1)
    userEmail = userEmail && (' <' + userEmail.toString().trim() + '>')

    if(userName && userEmail){
        return userName + userEmail
    } else if(userName) {
        return userName
    } else if(userEmail) {
        return userEmail
    } else {
        return ''
    }
}