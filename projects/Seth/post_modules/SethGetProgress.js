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
     * @type {{username: String, pseudopassword: Number, rounds: [{game: Number, stats: *, timestamp: String}]}}
     */
    let user = JSON.parse(rawUserData);
    
    // Look for the records.
    if (user.rounds != undefined) {
        // Look at the last game played and then tell them to continue.
        let LastGame = user.rounds[user.rounds.length - 1], NextGame = 1;

        // Define what their next game is.
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
                        NextGame = "null"
                }
                break;
            
            default:
                NextGame = 1;
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