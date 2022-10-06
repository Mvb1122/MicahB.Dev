// Loop through all of the ../Sets/ and return a list of their names and IDs.
const fs = require('fs');

let response = {
    name: "-1"
}

let path_to_user = `Hiragana_Teacher/Users/${args.author}/user.json`;
if (fs.existsSync(path_to_user))
    response.name = JSON.parse(fs.readFileSync(path_to_user)).username

res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
res.end(JSON.stringify(response));