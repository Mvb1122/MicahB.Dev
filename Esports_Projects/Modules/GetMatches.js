const fs = require('fs');
const EventPath = "Esports_Projects/Games/";

// Loop through all of the days, determine which days the player was present on, and which they were not.
let player = args.player;
let MatchesAttended = player != null ? GetMatches(player) : [];

// Send the data back to the client.
let data = { Matches: MatchesAttended }
if (MatchesAttended.length == 0) data.sucessful = false; else data.sucessful = true;
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
res.end(JSON.stringify(data));