const fs = require('fs');
const PlayerPath = "Esports_Projects/Players";
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
let players = fs.readdirSync(PlayerPath);
let game = unescape(args.game).trim();

// Go through each player and determine the games.
let games = { players: [] };
players.forEach(p => {
    let file = PlayerPath + "/" + p;
    let player = JSON.parse(GetFileFromCache(file));
    player.PlayedGames.forEach(element => {
        if (element.trim() == game) 
            games.players.push({
                Name: player.Name,
                "file": p
            })
    });
});

res.end(JSON.stringify(games));