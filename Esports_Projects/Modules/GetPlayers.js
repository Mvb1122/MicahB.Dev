const fs = require('fs');

res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
let players = fs.readdirSync("Esports_Projects/Players");

// Load players.
let output = "[";
players.forEach(player => {
    output += `"${player}",`
});
output = output.substring(0, output.length -1) + "]"

res.end(`{
    "Players": ${output}
}`
);