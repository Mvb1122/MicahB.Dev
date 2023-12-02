const fs = require('fs');

res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
let players = fs.readdirSync("Esports_Projects/Players");

// Load players.
let Players = [];
players.forEach(file => {
    let fileData = JSON.parse(GetFileFromCache(`./Esports_Projects/Players/${file}`).toString());
    if (fileData.Smash_Skill)
        Players.push(`${fileData.Smash_Skill}, ${global.esports.GetWinrate(file.replace(".json",""))}, ${file.substring(0, file.indexOf(".json"))}, ${global.esports.GetMatches(file.replace(".json","")).length}`) 
});

// Sort them and respond.
Players.sort((a, b) => {
    let aNumber = Number.parseFloat(a.substring(0, a.lastIndexOf(",")));
    let bNumber = Number.parseFloat(b.substring(0, b.lastIndexOf(",")));
    return bNumber - aNumber;
});

let response = {
    sucessful: true,
    players: Players
}

res.end(JSON.stringify(response));