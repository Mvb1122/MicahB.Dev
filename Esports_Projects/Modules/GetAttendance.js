const fs = require('fs');
const EventPath = "Esports_Projects/Events/";

// Loop through all of the days, determine which days the player was present on, and which they were not.
let player = args.player;
let DaysAttended = [];
fs.readdirSync(EventPath).forEach((e) => {
    let event = JSON.parse(fs.readFileSync(EventPath + e));
    let attending = false;
    for (let i = 0; i < event.Attending.length; i++) {
        let AttendingPlayer = event.Attending[i];
        // If they were there, append them being there to the list of days that they were there.
        if (AttendingPlayer == player) {
            attending = true;
            break;
        }
    }

    DaysAttended.unshift({
        Date: event.Date,
        Attending: attending
    });
})

// Send the data back to the client.
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
res.end(JSON.stringify({ Days: DaysAttended }));