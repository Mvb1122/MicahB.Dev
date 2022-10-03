const fs = require('fs');

/* Example data:
{
  "username": "aaa",
  "password": "1234"
}
*/

// Takes in a submitted user's data, verifies it and then writes it.
    // Note that this isn't designed for security since I'm not securing any details.
    // (And also because I really don't want to deal with handling encryption.)
let submitted = JSON.parse(data);

// Here, I limit the number of characters in either component to 50, just because I can.
let parts = [submitted.username.toString(), submitted.password.toString()];
for (let i = 0; i < parts.length; i++)
    if (parts[i].length > 50)
        parts[i] = parts[i].substring(0, 50);

let verifiedData = { 
    "username": parts[0],
    "password": parts[1],
}

// Check if somebody with that username already exists and decline the registration if they do.
async function GetUserFile() {
    return new Promise((res) => {
        let filePath = `Hiragana_Teacher/users/`;
        let directories = fs.readdirSync(filePath, { withFileTypes: true })
        directories.forEach(directory => {
            let pathToUserFile = `${filePath}/${directory.name}/user.json`;
            if (directory.isDirectory() && fs.existsSync(pathToUserFile)) {
                let data = JSON.parse(fs.readFileSync(pathToUserFile, (err) => {if (err) console.log(err)}));
                if (data.username == verifiedData.username)
                    return res(data);
            }
        });

        res(false);
    })
}

if (await GetUserFile()) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ "sucessful": false, "userID": -1 }));
}
    
// Generate a userID to assign to the user.
    // Just keep making up random numbers until you find one that isn't used. 
let userID = 0;
do {
    userID = Math.floor(Math.random() * 10000);
} while (fs.existsSync(`Hiragana_Teacher/users/${userID}/${userID}.json`))

// To add just the bare minimum of security, I'm just going to shift the user's password by the character code of the first digit in their username modulo 10.
    // Yes, I'm aware that publishing this comment here completely defeats the purpose, but it's mainly so that newbs who figure out that they can download the users' files 
    // (but that don't know about this repo) have to do at least the bare minimum ammount of work to figure it out.
verifiedData.password = await ObfuscatePassword(verifiedData.username, verifiedData.password);

res.statusCode = 200;
res.setHeader("Content-Type", "application/json");

// Write the user's data.
fs.mkdir(`Hiragana_Teacher/Users/${userID}/`, (err) => {
    if (err) console.log(err);
    fs.writeFile(`Hiragana_Teacher/Users/${userID}/user.json`, JSON.stringify(verifiedData), (err) => {if (err) console.log(err)});
})

res.end(JSON.stringify({ "sucessful": true, "userID": userID }));