// Temporary module...
const fs = require('fs');
const PlayerPath = "Esports_Projects/Players/";
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
let players = fs.readdirSync("./Esports_Projects/Players");

// Load players.
let output = [];
players.forEach(player => {
    player = JSON.parse(GetFileFromCache(PlayerPath + player)).Discord_id;
    output.push(player)
});

let outputResponse = {
    msg: ""
};

output.forEach(player => {
    outputResponse.msg += `<@${player}> `
})

res.end(JSON.stringify(outputResponse));