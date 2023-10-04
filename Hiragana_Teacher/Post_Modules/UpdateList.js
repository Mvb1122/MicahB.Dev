/* Example Data:
{
    "login_token": 123456,
    "Set": {
        "Name": "Hiragana/ひらがな",
        "ObjectName": "character",
        "AnswerName": "syllable",
        "Visibility": EITHER "public" OR "private",
        "ID": "The ID that this set is located under-- 123456",
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

// Find the path.
let setPath = `Hiragana_Teacher/Sets/${GivenData.Set.ID}.json`;
    
// Actually write the data.
let response = {
    "sucessful": true
}

// Add the author's name to the set and remove the ID.
GivenData.Set.Author = userID;
delete GivenData.Set.ID;

// Bring forward the old data and overlay the new data.
let finished = JSON.parse(fs.readFileSync(setPath));
Object.keys(GivenData.Set).forEach(key => {
    finished[key] = GivenData.Set[key]
})

fs.writeFile(setPath, JSON.stringify(finished), (err) => {
    if (err)  {
        response.sucessful = err;
        console.log(err);
    }
    return res.end(JSON.stringify(response));
});