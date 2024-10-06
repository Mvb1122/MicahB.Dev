const fs = require('fs');

res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
const PlayerPath = "Esports_Projects/Players";
let players = fs.readdirSync(PlayerPath);

// Load players.
let output = [];

// Sort alphabetically
players.sort((a, b) => {
    // Load both files, then use compare to sort.
    const player1 = JSON.parse(GetFileFromCache(PlayerPath + "/" + a))
    const player2 = JSON.parse(GetFileFromCache(PlayerPath + "/" + b))
    return player1.Name.localeCompare(player2.Name);
})

players.forEach(player => {
    output.push(player)
});

res.end(JSON.stringify({"Players": output}));