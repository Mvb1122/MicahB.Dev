const fs = require('fs');

res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
let players = fs.readdirSync("Esports_Projects/Players");

// Load players.
let Players = [];
players.forEach(file => {
    let fileData = JSON.parse(GetFileFromCache(`./Esports_Projects/Players/${file}`).toString());
    if (fileData.Smash_Skill)
        Players.push(`${fileData.Smash_Skill} ${file.substring(0, file.indexOf(".json"))}`) 
})

// Sort them and respond.
Players.sort().reverse();

let response = {
    sucessful: true,
    players: Players
}

res.end(JSON.stringify(response));