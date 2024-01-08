// ARGS: game = ["Super Smash Bros. Ultimate", "Splatoon" ...] : By default, SSBU.

const fs = require('fs');
const PlayerPath = "./Esports_Projects/Players/"
let players = [];
let output = "";


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

const gamesPath = './Esports_Projects/Games/';
const { GetReliability } = require("./Esports_Projects/Esports_Index.js");

function CompileOutput(Game = "Super Smash Bros. Ultimate") {
    // Aggregate information from files.
    let files = fs.readdirSync(gamesPath);
    files.forEach(file => {
        let data = JSON.parse(GetFileFromCache(gamesPath + file));
        
        // Only include games that are of the game we're requesting.
        if (data.Game == Game) {
            let WasitAWin = true;
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
    output += "name, wins, losses, winrate, reliability, \"Number of Matches\", ID, Grade, System UserID";
    if (Game == "Super Smash Bros. Ultimate") output += ", Skill Level"

    players.forEach(player => {
        const NumberOfMatches = player.Wins + player.Losses;
        const winrate = player.Wins / NumberOfMatches
        try {
            const reliability = GetReliability(player.Name, Game);
            const userData = JSON.parse(GetFileFromCache(`./Esports_Projects/Players/${player.Name}.json`));
            const PlayersActualName = userData.Name;
            output += `\n"${PlayersActualName}", ${player.Wins}, ${player.Losses}, ${winrate}, ${reliability.toPrecision(4) * 100}, ${NumberOfMatches}, ${userData.Student_id}, ${userData.Grade}, ${player.Name}`;
            
            if (Game == "Super Smash Bros. Ultimate") output += `, ${userData.Smash_Skill}`;

        } catch (e) {
            output += `\n "Account Deduplicated; Name lost.", ${player.Wins}, ${player.Losses}, ${winrate}, Lost, ${NumberOfMatches}, Lost, Lost, ${player.Name}, NOTE: This user was manually deduplicated.`;
        }
    })

    res.statusCode = 200;
}

switch (args.game) {
    case "SSBU":
    case "Super Smash Bros. Ultimate":
        CompileOutput("Super Smash Bros. Ultimate")
        break;

    case "Splatoon":
        CompileOutput("Splatoon");
        break;

    case "Mario Kart":
        CompileOutput("Mario Kart");
        break;

    case "All":
        output += "SSBU:\n"
        CompileOutput("Super Smash Bros. Ultimate");

        output += "\n\nSplatoon\n"
        CompileOutput("Splatoon");

        output += "\n\nMario Kart\n"
        CompileOutput("Mario Kart");
        break;


    default:
        output = "Name, PlayedGames, Discord_id, Student_id, Grade, Ranks Or Smash Skill";
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
        break;
}

// Tell the client to download/parse this file as CSV. 
res.setHeader("Content-Type", "text/csv");
res.setHeader("content-disposition", "attachment; filename=\"PlayerData.csv\"")
res.end(output);