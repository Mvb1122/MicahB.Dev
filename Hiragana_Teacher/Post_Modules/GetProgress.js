const fs = require('fs')
/* Example data:
{
    "login_token": 4469,
    "set": 1
}
*/

// Check if that person's progress exists.
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
let postData = JSON.parse(data)
let userID = await TokenToUserID(postData.login_token);
console.log(postData);
console.log(`Token: ${postData.login_token} userID: ${userID}`);
if (userID != undefined) {
    let PathToUsersFiles = `Hiragana_Teacher/Users/${userID}/`
    let setPath = PathToUsersFiles + postData.set + ".json";
    if (fs.existsSync(setPath))
        return res.end(fs.readFileSync(setPath).toString());
}

// Send back an empty set if something goes wrong...
return res.end(JSON.stringify({"Chances":[]}));