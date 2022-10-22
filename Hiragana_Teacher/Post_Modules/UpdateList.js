const fs = require('fs');
/* Example Data:
{
    "login_token": 123456,
    "Set": {
        "Name": "Hiragana/ひらがな",
        "ObjectName": "character",
        "AnswerName": "syllable",
        "Visibility": EITHER "public" OR "private",
        "ID": "The old ID that this set used to be located under-- 123456",
        "Set": [
            {"various entries": "various answers"}
        ]

        "Author": ADDED IN POST FROM LOGIN_TOKEN
    }
}
*/

// First, authenticate the user's data.
let GivenData = JSON.parse(data);
let userID;
let check = (userID = TokenToUserID(GivenData.login_token)) != -1

// If the user didn't have a valid token, end the request by telling them that...
res.setHeader("Content-Type", "application/json");
if (!check) {
    res.statusCode = 504;
    return res.end(JSON.stringify({"sucessful": false}))
}

// Find the path.
let setPath = `Hiragana_Teacher/Sets/${GivenData.Set.ID}.json`;
    
// Actually write the data.
let response = {
    "sucessful": true
}

// Add the author's name to the set and remove the ID.
GivenData.Set.Author = userID;
delete GivenData.Set.ID;

fs.writeFile(setPath, JSON.stringify(GivenData.Set), (err) => {
    if (err)  {
        response.sucessful = err;
        console.log(err);
    }
    return res.end(JSON.stringify(response));
});