let player = args.player;
const { GetAttendance } = require("./Esports_Projects/Esports_Index.js")
// Send the data back to the client.
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
res.end(JSON.stringify(GetAttendance(player)));