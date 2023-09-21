// ARGS: game = ["Super Smash Bros. Ultimate", "Splatoon" ...] : By default, SSBU.

const fs = require('fs');
// Process games into players by winrate.
    // Setup data structure.
    
/* Old Smash Stuff
    let players = [];
    function GetPlayerIndex(id) {
        for (let i = 0; i < players.length; i++)
            if (players[i].Name == id) return i;
        
        // If the player wasn't in the list, add them.
        return players.push({Name: id, Wins: 0, Losses: 0}) - 1;
    }

    function PutMatchIn(index, wasItAWin) {
        let data = players[index];

        if (wasItAWin)
            data.Wins++;
        else data.Losses++;

        players[index] = data;
    }

    const { GetReliability } = require("./Esports_Projects/Esports_Index.js")
    // Aggregate information from files.
    let gamesPath = './Esports_Projects/Games/';
    let gameToBeLogging = args.game == null ? "Super Smash Bros. Ultimate" : args.game;
    let files = fs.readdirSync(gamesPath);
    files.forEach(file => {
        let WasitAWin = true;
        let data = JSON.parse(GetFileFromCache(gamesPath + file));
        
        // Only include games that are of the game we're requesting.
        if (data.Game == gameToBeLogging) {
            if (data.Result != "Win") WasitAWin = false;

            // Put in the person's game as a win or a loss.
            data.Players.forEach(player => {
                PutMatchIn(GetPlayerIndex(player), WasitAWin)
            });
        
            // Put the game in for the loser as well.
            data.Enemies.forEach(player => {
                PutMatchIn(GetPlayerIndex(player), !WasitAWin)
            });
        }
    })

    // Turn the data into CSV.
    let output = "name, wins, losses, winrate, reliability, \"Number of Matches\", ID, Grade, \"Has Filled out Survery\"";
    players.forEach(player => {
        let NumberOfMatches = player.Wins + player.Losses;
        let winrate = player.Wins / NumberOfMatches
        let reliability = GetReliability(player.Name);
        let PlayersActualName = JSON.parse(GetFileFromCache(`./Esports_Projects/Players/${player.Name}.json`)).Name;

        try {
            output += `\n"${PlayersActualName}", ${player.Wins}, ${player.Losses}, ${winrate}, ${reliability}, ${NumberOfMatches}, ${player.Student_id}, ${player.Grade}, UNSURE`;
        } catch (e) {
            output += `\n "${PlayersActualName}" has an error! ` + e;
        }
    })
*/

const PlayerPath = "./Esports_Projects/Players/"
let output = "Name, PlayedGames, Discord_id, Student_id, Grade";
fs.readdirSync(PlayerPath).forEach(file => {
    let player = JSON.parse(GetFileFromCache(`./Esports_Projects/Players/${file}`));
    output += "\n"
    Object.keys(player).forEach(key => {
        /** @type {String} */
        let val = player[key].toString();
        if (val.includes(",")) val = `""${val.replaceAll(",", "_")}""`
        output += val + ", ";
    })
})
res.statusCode = 200;

// Tell the client to download/parse this file as CSV. 
res.setHeader("Content-Type", "text/csv");
res.setHeader("content-disposition", "attachment; filename=\"PlayerData.csv\"")
res.end(output);