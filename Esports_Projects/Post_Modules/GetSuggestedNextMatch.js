/*
Example Data:
{
    "id": "1234567890",
}

Returned: 
{
    successful: true,
    Players: [] // Ideally select randomly from this list.
}
*/

const fs = require('fs'), PlayerPath = "Esports_Projects/Players"
/**
 * @type {{"File": String, "id": Number}}
 */
let GivenData = JSON.parse(data);
if (!fs.existsSync(`${PlayerPath}/${GivenData.id}.json`)) {
    res.statusCode = 200;
    return res.end(JSON.stringify({ successful: false, reason: "Invalid user!" }));
}

// Load the players into memory. (Use currently open Smash event.)
    // Get events.
/**
 * @type {[{Attending: Number[];Excused: [{ "player": Number, "excuse": String }];Date: String;StartTime: string;Games: String[];}]}
 */
const events = global.EventCache;
console.log(events);
/**
 * @type {{Attending: Number[];Excused: [{ "player": Number, "excuse": String }];Date: String;StartTime: string;Games: String[];}}
 */
let eventInFocus = undefined;
const EventNumbers = Object.keys(events);
for (let i = 0; i < EventNumbers.length; i++) {
    const event = events[EventNumbers[i]];
    console.log(event);
    
    // Check if the event's games includes Smash Bros.
        // Just use the first smash event that has the selected player in it.
    let includesSmash = false;
    for (let i = 0; i < event.Games.length; i++) {
        if (event.Games[i].toLowerCase().includes("smash"))
        {
            includesSmash = true;
            break;
        }
    }
        // Look for the player.
    let includesPlayer = false;
    for (let i = 0; i < event.Attending.length; i++) {
        if (event.Attending[i] == GivenData.id) {
            includesPlayer = true;
            break;
        }
    }

    if (includesPlayer && includesSmash) {
        eventInFocus = event;
        break;
    }
}

// If we don't have an event, say it.
if (eventInFocus == undefined) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({
        successful: false,
        reason: "No smash events open! Please take attendance."
    }));
}

console.log(eventInFocus);

// Load player files into memory.
/** @type {[{Name: string,PlayedGames?: (string)[] | null, Discord_id: string,Student_id: string, "Smash_Skill":Number, FileName: String}]} */
const players = fs.readdirSync(PlayerPath); // eventInFocus.Attending;
console.log(players);

for (let i = 0; i < players.length; i++)
    players[i] = new Promise(async res => {
        const fileName = `${players[i]}`;
        console.log(fileName);
        let data = JSON.parse(await GetFileFromCache(`${PlayerPath}/${fileName}`));
        data.FileName = fileName;
        res(data);
    })

// Look at the player's smash skill.
Promise.all(players).then(() => {
    /** @type {{Name: string,PlayedGames?: (string)[] | null, Discord_id: string,Student_id: string, "Smash_Skill":Number}} */
    const passedPlayer = JSON.parse(GetFileFromCache(`${PlayerPath}/${GivenData.id}.json`));

    // Calculate SD of players.
        // Calculate average smash skill.
    let average = 0;
    players.forEach((v) => {
        if (v.Smash_Skill)
            average += v.Smash_Skill
    });
    average /= players.length;

    // Calculate SD.
    let SD = 0;
    players.forEach((v) => {
        if (v.Smash_Skill) {
            SD += (v.Smash_Skill - average) ** 2;
        }
    });
    SD = Math.sqrt(SD / players.length);

    function GetPlayersWithinSDOf(Skill, Range = 1) {
        // DEBUG:
        if (true) {
            console.log(`Attempting to find players within ${Range}SD of ${Skill}\nAvg: ${average}, SD: ${SD}`);
        }
        // Look at all players.
        const min = Skill - (SD * Range), max = Skill + (SD * Range);
        /**
         * @type {[String]}
         */
        const ApplicablePlayers = [];
        players.forEach(player => {
            if (player.Smash_Skill != undefined && player.Smash_Skill >= min && player.Smash_Skill <= max)
                ApplicablePlayers.push(player.FileName);
        });

        // If the passed user is in the list, remove them. (They will always be in the list.)
        ApplicablePlayers.splice(ApplicablePlayers.indexOf(GivenData.id), 1);

        if (ApplicablePlayers.length > 0 || Range > 9) return ApplicablePlayers;
        else return GetPlayersWithinSDOf(Skill, Range + 1);
    }
    
    let response = {
        successful: true,
        Players: []
    }

    // If they have a defined smash_skill stat, find users with similar stats.
    console.log(passedPlayer.Smash_Skill)
    if (passedPlayer.Smash_Skill == undefined) {
        response.Players = GetPlayersWithinSDOf(average);
    } else {
        response.Players = GetPlayersWithinSDOf(passedPlayer.Smash_Skill);
    }
    // If they don't have a defined smash_skill stat, recommend people around the average.
    res.statusCode = 200;
    return res.end(JSON.stringify(response));
})