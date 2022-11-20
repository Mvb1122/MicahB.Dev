const fs = require('fs');

res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
let players = fs.readdirSync("Esports_Projects/Players");

// Load players.
let output = [];
players.forEach(player => {
    output.push(player)
});

res.end(JSON.stringify({"Players": output}));