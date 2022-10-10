/* Example Data
{
    "token": 123456,
    "Set": 123456
}
*/

let GivenData = JSON.parse(data);
let token = TokenToUserID(GivenData.token);

// Go through all the sets and add the private ones that the author has made to the list.
const fs = require('fs');
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");

let response = {
    "sucessful": false
}

if (fs.existsSync(`Hiragana_Teacher/Sets/${GivenData.Set}.json`))
{
    fs.unlink(`Hiragana_Teacher/Sets/${GivenData.Set}.json`, (err) => {
        if (err) {
            console.log(err);
            return res.end(JSON.stringify(response));
        } else {
            response.sucessful = true;
            return res.end(JSON.stringify(response));
        }
    })
}
