const fs = require('fs');
const PlayersPath = "Esports_Projects/Players"

// Look at the player cache and see if there's a result.
    // If there is, the status is "Waiting"
    // If there isn't, check the players folder for a file that is named after the token.
        // If the file exists, the status is "Registered"
        // If the file doesn't exist the status is "Waiting"
let token = args.token;

let status;
if (global.playerCache[token]) status = "Waiting";
else if (fs.existsSync(`${PlayersPath}/${token}.json`))
{
    status = "Registered";
} else status = "Waiting";

// Send the data back to the client.
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
res.end(JSON.stringify({ Status: status }));