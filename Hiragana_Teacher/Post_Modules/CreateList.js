const fs = require('fs');
/* Example Data:
{
    "login_token": 123456,
    "Set": {
        "Name": "Hiragana/ひらがな",
        "ObjectName": "character",
        "AnswerName": "syllable",
        "Visibility": EITHER "public" OR "private"
        "Set": [
            {"various entries": "various answers"}
        ]

        "Author": ADDED IN POST FROM LOGIN_TOKEN
    }
}
*/

// First, authenticate the user's data.
let GivenData = JSON.parse(data);
let userID = TokenToUserID(GivenData.login_token);
let check = userID != -1

// If the user didn't have a valid token, end the request by telling them that...
res.setHeader("Content-Type", "application/json");
if (!check) {
    res.statusCode = 403;
    return res.end(JSON.stringify({"sucessful": false, "reason": "Token is invalid."}))
}

// Write the data.
let setPath = "Hiragana_Teacher/Sets";
    // Ascertain a set number.
let setNumber = 0;
do {
    setNumber = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
} while (fs.existsSync(`${setPath}/${setNumber}.json`));
    
// Actually write the data.
let response = {
    "sucessful": true
}

// Add the author's name to the set.
GivenData.Set.Author = userID;
if (GivenData.Set.ID != undefined)
    delete GivenData.Set.ID;

fs.writeFile(`${setPath}/${setNumber}.json`, JSON.stringify(GivenData.Set), (err) => {
    if (err) response.sucessful = err;
    return res.end(JSON.stringify(response));
});