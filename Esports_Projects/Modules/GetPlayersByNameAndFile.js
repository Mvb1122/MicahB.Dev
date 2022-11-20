const fs = require('fs');

res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
let players = fs.readdirSync("Esports_Projects/Players");

// Load players.
let output = [];
players.forEach(file => {
    let fileData = JSON.parse(GetFileFromCache(`Esports_Projects/Players/${file}`).toString());
    output.push({
        playerName: fileData.Name,
        file: file.toString()
    }) 
})

let response = {
    sucessful: true,
    players: output
}

res.end(JSON.stringify(response));