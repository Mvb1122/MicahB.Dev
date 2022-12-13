const fs = require('fs');
/* Example Data:
{
    "token": 1445,
    "Winners": [ 1234 ],
    "Losers": [ 12345 ],
    "Options": { // All values under Options should be considered as nullable, although you really should include a game.
        "TeamName": TeamName,
        "Game": "Super Smash Bros. Ultimate" || "Mario Kart" || "Splatoon" ...
        "Map": "Final Destination"
    }
}
*/

// First, authenticate the user's data.
let GivenData = JSON.parse(data);
res.setHeader("Content-Type", "application/json");
if (!IsESportsLoginTokenValid(GivenData.token))
    return res.end(JSON.stringify({"sucessful": false, "reason": "Invalid Token!"}));

// If the user didn't have valid users, tell them that.
// Determine if there are any invalid players
let check = true;
[GivenData.Winners, GivenData.Losers].forEach(team => team.forEach(player => {
    if (check)
        check = fs.existsSync(`./Esports_Projects/Players/${player}.json`)
}))

if (!check) {
    res.statusCode = 403;
    return res.end(JSON.stringify({"sucessful": check, "reason": "Invalid Players!"}))
}

// Write the data.
let date = new Date();
let today = date.toISOString().slice(0, 10).replaceAll("-", "/");

let writeData = {
    "Players": GivenData.Winners,
    "Enemies": GivenData.Losers,
    "Result": "Win",
    "DateOfMatch": today
}

// Include any optional information shared.
if (GivenData.Options.TeamName != null)
    writeData.TeamName = GivenData.Options.TeamName;

if (GivenData.Options.Game != null)
    writeData.Game = GivenData.Options.Game;

if (GivenData.Options.Map != null && GivenData.Options.Map != "")
    writeData.Map = GivenData.Options.Map;

let num = 0, path = "";
do {
    num = Math.floor(Math.random() * 100000);
    path = `Esports_Projects/Games/${num}.json`;
} while (fs.existsSync(path));

fs.writeFile(path, JSON.stringify(writeData), (err) => {
    let response = {
        "sucessful": err == null,
    }

    if (err)
        response.err = err;

    res.end(JSON.stringify(response));
})