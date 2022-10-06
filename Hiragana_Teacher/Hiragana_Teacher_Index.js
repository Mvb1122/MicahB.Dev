const fs = require('fs')
// As used by Post_Modules, functions for logging in or otherwise getting stored information.
// Creates a login token for the user; used to authenticate for creating and editing lists.
const _Tokens = [];
async function GetLoginToken(user) {
    // First, check if the user's information is correct.
    let userFile = await GetUserFile(user.username);
    user.password = await ObfuscatePassword(user.username, user.password)

    console.log("userfile: " + JSON.stringify(userFile))
    console.log("user: " + JSON.stringify(user));

    let check = userFile != -1 ? await CheckPassword(userFile, user) : false;
    console.log("Is the user's password correct: " + check)
    if (!check) {
        return -1;
    };

    // Randomly generate a number, assign the user's information to that token.
    let token = 0;
    do {
        token = Math.floor(Math.random() * 10000);
    } while (_Tokens[`${token}`] != null)

    _Tokens[`${token}`] = user;

    return token;
}

function TokenToUserID(token) {
    // Go through the user files and find the one which matches the user file that we have in cache.
    token = _Tokens[`${token}`];
    if (token != undefined)
        return GetUserID(token.username);
    return -1;
}

function InvalidateToken(token) {
    console.log(`Invalidated token ${token}.`)
    _Tokens[token.toString()] = null;
}

// Loads the user's data from storage.
const websitePath = "Hiragana_Teacher/"
const userPath = `${websitePath}/Users/`;
async function GetUserFile(username) {
    return new Promise((res) => {
        // Read each folder's user file and return it if it's the right one.
        fs.readdirSync(userPath).forEach(file => {
            let userData = JSON.parse(fs.readFileSync(`${userPath}/${file}/user.json`));
            if (userData.username == username)
                res(userData);
        })

        res(-1);
    })
}

function GetUserID(username) {
    // Read each folder's user file and return it if it's the right one.
    let value;
    fs.readdirSync(userPath).forEach(file => {
        let userData = JSON.parse(fs.readFileSync(`${userPath}/${file}/user.json`));
        if (userData.username == username)
            value = file;
    })

    return value == undefined ? -1 : value;
}

function CheckPassword(userFile, submitted) {
    userFile.password = userFile.password.toString().split("_");
    submitted.password = submitted.password.toString().split("_");

    console.log(`User's actual password: ${userFile.password}\nSubmitted password: ${submitted.password}`);

    // Compare passwords and return whether or not they match.
    if (userFile.password.length == submitted.password.length) {
        for (let i = 0; i < submitted.password.length - 1; i++) {
            if (userFile.password[i] != submitted.password[i]) {
                return false;
            }
        }

        return true;
    }

    return false;
}

async function ObfuscatePassword(username, password) {
    username = username.toString(); password = password.toString();
    // "Encrypt" the user's password.
        // All this function does is make it hard to figure out what the user's actual password is, even tho it's like pretty easy to just request this file and run it backwards.
    let charCode = username.charCodeAt(0) % 10;
    let encodedPassword = "";
    for (let i = 0; i < password.length; i++) 
    {
        encodedPassword += (password.charCodeAt(i) << charCode) + "_";
    }

    return encodedPassword;
}