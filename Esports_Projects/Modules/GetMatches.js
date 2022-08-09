const fs = require('fs');
const EventPath = "Esports_Projects/Games/";

// Loop through all of the days, determine which days the player was present on, and which they were not.
let player = args.player;
let MatchesAttended = [];
fs.readdirSync(EventPath).forEach((e) => {
    let event = JSON.parse(fs.readFileSync(EventPath + e));
    event.Players.forEach(AttendingPlayer => {
        // If they were there, append them being there to the list of days that they were there.
        if (AttendingPlayer == player)
            // (Convert the day to a number, just in case.)
            MatchesAttended.push(1 * e.substring(0, e.indexOf('.')));
    });
})

// Send the data back to the client.
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
res.end(JSON.stringify({ Matches: MatchesAttended }));