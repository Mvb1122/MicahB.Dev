const fs = require('fs')
/* Example data:
{
    "login_token": 4469,
    "set": 1,
    "changes": [
        {
            "Character": "あ",
            "Chance": 3
        },
        {
            "Character": "い",
            "Chance": 2
        }
    ]
}
*/

// Get the user's info and figure out where to write changes.
let postInfo = JSON.parse(data);
let userID = await TokenToUserID(postInfo.login_token);
console.log(`Token: ${postInfo.login_token} userID: ${userID}`);
if (userID != undefined && userID != -1) {
    let PathToUsersFiles = `Hiragana_Teacher/Users/${userID}/`
    let setLocation = `${PathToUsersFiles}${postInfo.set}.json`;

    // If the user doesn't have a file for that set, write one.
    if (!fs.existsSync(setLocation))
        fs.writeFileSync(setLocation, JSON.stringify({"Chances": postInfo.changes}));
    else {
        // Read in the data, append/overwrite the changes.
        let data = JSON.parse(fs.readFileSync(setLocation));
        
        charLoop:
        for (let i = 0; i < postInfo.changes.length; i++) {
            let element = postInfo.changes[i];
            let selectedPart = element.Character;

            // If the character is already on the list, overwrite the change.
            for (let i = 0; i < data.Chances.length; i++) {
                let characterSet = data.Chances[i];
                if (characterSet.Character == selectedPart) {
                    data.Chances[i].Chance = element.Chance;
                    // Skip the rest of this loop if we've already overwritten a character.
                    continue charLoop;
                }
            }

            // If it wasn't already on this list, add it.
            data.Chances.push(element);
        }

        fs.writeFile(setLocation, JSON.stringify(data), (err) => {
            if (err) console.log(err)
        })
        
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({sucessful: true}));
}

return res.end(JSON.stringify({sucessful: (userID != undefined)}));