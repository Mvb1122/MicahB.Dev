const fs = require('fs')
const PlayerPath = "Esports_Projects/Players/";
let player = args.player;

// Send the data back to the client.
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
res.end(JSON.stringify(GetAttendance(player)));