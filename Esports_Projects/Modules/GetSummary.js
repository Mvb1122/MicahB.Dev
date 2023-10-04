const fs = require('fs');
const EventPath = "Esports_Projects/Events/";
// Get attendance summary by looking through the events.
let summary = "Events:\n";
let files = fs.readdirSync(EventPath);
let numProcessing = files.length;

files.forEach(async (file) => {
    file = JSON.parse(fs.readFileSync(EventPath + file));

    let GameText = "";
    if (file.Games)
        for (let i = 0; i < file.Games.length; i++)
            GameText += ` ${file.Games[i]},`;
    else
        GameText = "Unknown."

    let data = `Day - ${file.Date}\nTime: ${file.StartTime}-${file.EndTime}\nGames:${GameText.substring(0, GameText.length - 1)}\nNumber of players attending: ${file.Attending.length}\n\n`;

    summary += data;
    numProcessing--;
})

res.statusCode = 200;
res.setHeader("Content-Type", "text/plain");
res.end(summary);