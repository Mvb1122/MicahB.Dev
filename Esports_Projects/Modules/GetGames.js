const fs = require('fs');
const PlayerPath = "Esports_Projects/Players";
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
let players = fs.readdirSync(PlayerPath);

// Go through each player and determine the games.
let games = { games: {} };
players.forEach(p => {
    let player = JSON.parse(fs.readFileSync(PlayerPath + "/" + p));
    player.PlayedGames.forEach(element => {
        if (games.games[element]) 
            games.games[element]++;
        else
            games.games[element] = 1;
    });
});

res.end(JSON.stringify(games));