/* Example Data:
{
    username: username,
    pseudopassword: pseudopassword
}

Example response:
{
    sucessful: true,
    game: "1", // 1 || 2 || 3a || 3b || 3c
}
*/

const UserFolderPath = "./projects/Seth/users/", fs = require('fs');
data = JSON.parse(data);

// Load the user's file.
try {
    const UserPath = data.username
        // Sanitize path!
        .replace(/[/\\?%*:|"<>]/g, '-') 
        + ".json";

    // Read in and parse the user's data.
    const rawUserData = fs.readFileSync(UserFolderPath + UserPath);
    /**
     * @type {{username: String, pseudopassword: Number, rounds: [{game: Number, stats: *, timestamp: String}], questionnaire: {EarlyMorningActivities: string; HoursOfSleep: string; BedTime: string; WakeTime: string; Sex:  string; Age:  string; Grade: string;}}}
     */
    let user = JSON.parse(rawUserData);
    
    // Look for the records.
    if (user.rounds != undefined) {
        // Define what their next game is.
        /* Old one-time scope version:
            // Look at the last game played and then tell them to continue.
        let LastGame = user.rounds[user.rounds.length - 1], NextGame = 1;
        switch (LastGame.game) {
            case 1:
                NextGame = "2";
                break;
            case 2:
                NextGame = "3a";
                break;
            case 3:
                // Look at their stats.
                let stats = LastGame.stats;
                switch (stats.part) {
                    case "3a":
                        NextGame = "3b";
                        break;
                    
                    case "3b": 
                        NextGame = "3c";
                        break;
                    
                    case "3c":
                        if (!user.questionnaire.EarlyMorningActivities)
                            NextGame = "null"
                        else 
                            "3d"
                    
                    // At this point, the user has played all the way up through 3c or 3d, and now they need to restart for the next day.
                    default:
                        NextGame = "1";
                }
                break;
            
            // Error case:
            default:
                NextGame = "1";
        }
        */
        // New way: Look at their runs. Check which ones have a timestamp from today.
            // <3 Part 3a, 3<6 Part 3b, 6<9 Part 3c, >=9 3d
        let NumberOfGameThreeRoundsToday = 0, NextGame = "3a"

        const now = new Date(Date.now());
        const timestamp = `${now.getMonth() + 1}/${now.getDay() + 1}/${now.getFullYear()}`;
        user.rounds.forEach(round => {
            if (round.timestamp.startsWith(timestamp) && round.game == 3) NumberOfGameThreeRoundsToday++;
        })

        switch (NumberOfGameThreeRoundsToday) {
            case 0:
                NextGame = "3a"
                break;
            
            case 1:
                NextGame = "3b"
                break;
            
            case 2:
                NextGame = "3c"
                break;

            case 3:
                // If they've already played three games, only let them play more if they're experimental.
                if (user.questionnaire.EarlyMorningActivities)
                    NextGame = "3d";
                else NextGame = "end";
                break;
            
            default:
                NextGame = "end"
        }

        res.end(JSON.stringify({
            sucessful: true,
            game: NextGame
        }));
    } else {
        res.end(JSON.stringify({
            sucessful: true,
            game: 1
        }));
    }
} catch (e) {
    // If there's any errors, just tell them that something went wrong.
    console.log(e)
    res.end(JSON.stringify({
        sucessful: false,
        reason: "Something went wrong. (Probably invalid login.)",
    }))
}