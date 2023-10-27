const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const { ContextMenuCommandInteraction } = require('discord.js');
const Discord = require('discord.js');
const index = require('../index.js')
let GetFileFromCache = index.GetFileFromCache;
let global = index.global;

if (global.esports == undefined)
    global.esports = {};
global.esports.GetValidToken = GetValidToken;

const GamesPath = "Esports_Projects/Games"
const EventPath = "Esports_Projects/Events"

// Correct games with a PlayedGameTag:
/*
let Games = fs.readdirSync(GamesPath)
Games.forEach(Game => {
    // Load the file.
    let data = JSON.parse(GetFileFromCache(GamesPath + `/${Game}`));
    if (data.Game == null && data.PlayedGame != null) data.Game = data.PlayedGame;
    delete data.PlayedGame;

    // Write it.
    fs.writeFile(GamesPath + `/${Game}`, JSON.stringify(data), () => {});
})
*/

// LoginTokens should be invalidated on restart; thus, they are not persisted in global.
let LoginTokens = [];
function GetValidToken() {
    let newToken = Math.floor(Math.random() * 1000);
    LoginTokens.push(newToken)
    return newToken;
}

function IsESportsLoginTokenValid(token) {
    token = Number.parseInt(token);
    for (let i = 0; i < LoginTokens.length; i++) {
        let tokenInList = LoginTokens[i];
        console.log(`Checking: ${token} against ${tokenInList}`);
        if (token == tokenInList) return true;
    }
    
    return false;
}
global.esports.IsESportsLoginTokenValid = IsESportsLoginTokenValid;

// This is used by web modules.
function AddPlayerToCache(player) {
    let playerID = 0;
    do {
        playerID = Math.floor(Math.random() * 999999)
    } while (fs.existsSync(`Esports_Projects/Players/${playerID}.json`))

    // Save the player's information to the cache, and return it.
    global.playerCache[playerID.toString()] = player;

    console.log("New Player: " + JSON.stringify(player));

    return playerID.toString();
}

const PlayersPath = "Esports_Projects/Players";

/// Returns -1 if no player is found, otherwise, the player ID.
function GetPlayerIDFromDiscordID(DiscordID) {
    // Cut off the Discord bits if they are on there.
    if (DiscordID.toString().startsWith("<"))
        DiscordID = DiscordID.toString().slice(2, -1)

    // Go through each player file and find the one that has it.
    let output = -1;
    fs.readdirSync(PlayersPath).forEach((file) => {
        let data = JSON.parse(GetFileFromCache(`${PlayersPath}/${file}`));
        // console.log(`\tData: ${data}\n\tID: ${DiscordID}\n\tCheck: ${data.Discord_id == DiscordID.toString()}`);
        if (data.Discord_id == DiscordID.toString())
            output = file.toString().split(".")[0];
    })
    return output;
}

function GetMaxMatches(game) {
    // Get a list of games.
    let games = fs.readdirSync("Esports_Projects/Games/");
    // Group games by players.
    let NumGamesByPlayer = [];
    games.forEach(game => {
        let data = JSON.parse(GetFileFromCache(`Esports_Projects/Games/${game}`));
        [data.Players, data.Enemies].forEach(player => {
            if (NumGamesByPlayer[player] == null)
                NumGamesByPlayer[player] = 0;
            
            NumGamesByPlayer[player]++;
        })
    })

    // Determine who has the most matches.
    let maxMatches = -1, playerWithMostMatches = -1;
    Object.keys(NumGamesByPlayer).forEach(player => {
        if (NumGamesByPlayer[player] > maxMatches) {
            playerWithMostMatches = player; maxMatches = NumGamesByPlayer[player];
        }
    })

    return { "player": playerWithMostMatches, "numMatches": maxMatches }
}

function ArrayContains(array, val) {
    for (let i = 0; i < array.length; i++)
        if (array[i] == val) return true; 
    return false;
}

function GetMatches(player) {
    player = player.toString().toLowerCase().trim()
    // Get a list of games.
    let games = fs.readdirSync("Esports_Projects/Games/");
    let playersGames = [];
    
    for (let i = 0; i < games.length; i++) {
        let game = games[i];
        
        // Read each file in and determine if it has the player.
        let data = JSON.parse(GetFileFromCache(`Esports_Projects/Games/${game}`));
        [data.Players, data.Enemies].forEach(side => side.forEach(PlayerInGame => {
            if (player == PlayerInGame) {
                data.Game = game;
                playersGames.push(data);
            }
        }));
    }

    return playersGames;
}

function GetWinrate(player) {
    let matches = GetMatches(player);
    let wins = 0;
    matches.forEach(match => {
        if (match.Players != null && ArrayContains(match.Players, player)) // (match.TeamName != null && match.Result == "Win") || ( 
            wins++;
    })

    let winrate = wins / matches.length;
    return winrate == null ? 0 : winrate;
}

function GetAttendance(player) {
    let PlayerFilePath = `${PlayersPath}/${player}.json`;
    let DaysAttended = [], AdditionalDaysAttended = [];
    if (fs.existsSync(PlayerFilePath)) {
        let PlayerInfo = JSON.parse(GetFileFromCache(PlayerFilePath));

        fs.readdirSync(EventPath).forEach((e) => {
            let event = JSON.parse(GetFileFromCache(`${EventPath}/${e}`));

            // If the event contains one of the players' games, include it in the normal list. Else, put it in the extra days list.
            let IsPlayerGame = false;
            event.Games.forEach((game) => {
                for (let i = 0; i < PlayerInfo.PlayedGames.length; i++)
                    if (PlayerInfo.PlayedGames[i] == game) {
                        IsPlayerGame = true;
                        break;
                    }
            })
            
            let attending = "false";
            for (let i = 0; i < event.Attending.length; i++) {
                let AttendingPlayer = event.Attending[i];
                // If they were there, append them being there to the list of days that they were there.
                if (AttendingPlayer == player) {
                    attending = "true";
                    break;
                }
            }

            // If they weren't attending, check if they were excused.
            if (attending == "false" && event.Excused != undefined) 
                for (let i = 0; i < event.Excused.length; i++) {
                    let ExcusedPlayer = event.Excused[i];
                    if (ExcusedPlayer.player == player)
                    {
                        attending = { state: "excused", excuse: ExcusedPlayer.excuse };
                        break;
                    }
                }

            if (IsPlayerGame) {
                DaysAttended.unshift({
                    Date: event.Date,
                    Attending: attending
                });
            } else {
                AdditionalDaysAttended.unshift({
                    Date: event.Date,
                    Attending: attending
                })
            }
        })
    }

    return { Days: DaysAttended, AdditionalDays: AdditionalDaysAttended};
}

const PlayerPath = "Esports_Projects/Players"
function GetPlayersWhoPlayGame(game) {
    let players = fs.readdirSync(PlayerPath);
    game = game.trim();

    // Go through each player and determine the games.
    let games = [];
    players.forEach(p => {
        let player = JSON.parse(GetFileFromCache(PlayerPath + "/" + p));
        player.PlayedGames.forEach(gameInList => {
            if (gameInList.trim() == game) 
                games.push({
                    Name: player.Name,
                    Discord_id: player.Discord_id,
                    Student_id: player.Student_id,
                    PlayerID: p.substring(0, p.indexOf('.'))
                })
        });
    });

    return games;
}

function GetMaxMatchesInGame(game) {
    // Obtain a list of all of the players who play a game.
    let players = GetPlayersWhoPlayGame(game);

    // Go through each player and determine who has the most matches.
    let maxIndex = -1, maxMatches = -1;
    for (let i = 0; i < players.length; i++) {
        let player = GetMatches(players[i].PlayerID);
        if (maxMatches < player.length) {
            maxIndex = i;
            maxMatches = player.length;       
        }
    }

    return { player: players[maxIndex], numMatches: maxMatches };
}

function GetReliability(player) {
    // Get player information.
    let playerInfo = JSON.parse(GetFileFromCache(`${PlayerPath}/${player}.json`));
    // Determine the game to be played (just whatever their first one is.)
    let game = playerInfo.PlayedGames[0];

    // Obtain the Game-based reliability score.
    let PlayersGames = GetMatches(player).length;
    let maxMatches = GetMaxMatchesInGame(game).numMatches;
    let oldReliability = PlayersGames / maxMatches;
    
    // Obtain the Attendance-based reliability score.
        // Get a list of days that were/were not attended.
    let attendedEvents = GetAttendance(player);

    let attending = 0;
        // Count up the number of days attended.
    [attendedEvents.Days, attendedEvents.AdditionalDays].forEach(set => set.forEach(day => {
        if (day.Attending) attending++;
    }))

    let AttendanceReliability = attending / (attendedEvents.Days.length)

    // Average the two scores.
    return (oldReliability + AttendanceReliability) / 2;
}

function GetPlayerSkill(PlayerID) {
    let Skill = 1;
    const PlayerFile = `./Esports_Projects/Players/${PlayerID}.json`;
    if (fs.existsSync(PlayerFile)) {
        let Player = JSON.parse(fs.readFileSync(PlayerFile));
        if (Player.Smash_Skill != null) {
            Skill = Player.Smash_Skill;
        }
    }
    return Skill;
}

function SetPlayerSkill(PlayerID, Skill) {
    const PlayerFile = `./Esports_Projects/Players/${PlayerID}.json`;
    if (fs.existsSync(PlayerFile)) {
        let Player = JSON.parse(fs.readFileSync(PlayerFile));
        Player.Smash_Skill = Skill;
        const data = JSON.stringify(Player);
        fs.writeFile(PlayerFile, data, (e) => {
            if (e)
                console.log("Error: " + e);
        })
        
        // Update the cache.
        File_Cache[PlayerFile] = data;
    }
}

// Start the Discord bot.
const botInfo = JSON.parse(fs.readFileSync("Esports_Projects/token.json").toString());
const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

module.exports = {
    "GetValidToken": GetValidToken, IsESportsLoginTokenValid, AddPlayerToCache, GetPlayerIDFromDiscordID,
    GetMaxMatches, GetMatches, GetWinrate, GetAttendance, GetPlayersWhoPlayGame, GetMaxMatchesInGame,
    GetReliability, GetPlayerSkill, SetPlayerSkill
}

let SlashCommands = []
client.once('ready', () => {
	console.log('Discord bot online.');
    let commands = ["./Slash_Commands/CreateEvent.js", "./Slash_Commands/link.js"]; // File paths here.
    //#region Command handler stuff.
    let CommandJSON = [];
    commands.forEach(command => {
        // console.log(fs.readFileSync(command).toString())
        const Module = require(command);
        if ('data' in Module && 'execute' in Module) {
            SlashCommands.push(Module);
            CommandJSON.push(Module.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${command} is missing a required "data" or "execute" property.`);
        }
    });

    const rest = new Discord.REST().setToken(botInfo.token);
    const DiscordClientId = "1002343965695164427"
    const guildId = "762867801575784448"
    // Refresh commands:
    const UpdateCommands = async () => {
        try {
        console.log(`Started refreshing application commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Discord.Routes.applicationCommands(DiscordClientId /*, guildId */ ), // use with ApplicationGuildCommands for testing.
            { body: CommandJSON },
        ); 

        // Clear support server commands.
        await rest.put(
            Discord.Routes.applicationGuildCommands(DiscordClientId, guildId),
            { body: {} },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
        }
    };
    UpdateCommands(); 
    //#endregion
}); 

//#region Interaction handling
client.on("interactionCreate",
  /**
   * @param {Discord.CommandInteraction} int 
   */
  async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // Find command by name.
    const name = interaction.commandName;
    for (let i = 0; i < SlashCommands.length; i++) {
      const module = SlashCommands[i];
      /** @type {Discord.SlashCommandBuilder} */
      let data = module.data;
      if (data.name == name) {
        module.execute(interaction);
      }
    }
})

module.exports = {
    GetWinrate,
    GetAttendance,
    GetMatches,
    GetMaxMatches,
    GetPlayerIDFromDiscordID,
    GetReliability,
}

client.on("messageCreate", async (message) => {
    if (message.author.bot) return false; 
    const c = message.content;
    
    // Handles registering players.
    if (c.startsWith("/link")) {
        let link_code = c.substring(c.indexOf(' ') + 1);

        // Fetch player information from cache.
        let playerInfo = global.playerCache[link_code];
        if (playerInfo == undefined) {
            message.reply("Invalid link code! Check your code, please.");
            return false;
        }

        // Assumes a valid link code and collates player data.
        const Full_Player_Information = {
            "Name": playerInfo.Player,
            "PlayedGames": playerInfo.Games,
            "Discord_id": message.author.id,
            "Student_id": playerInfo.Id,
            "Grade": playerInfo.Grade,
            "Ranks": playerInfo.Ranks
        }
            // Save data to player database.
                // If the player is already registered, update their existing profile.
        let ReplyStart = "Registration suceeded!"
        if (GetPlayerIDFromDiscordID(message.author.id) != -1) {
            global.playerCache[link_code] = undefined;
            link_code = GetPlayerIDFromDiscordID(message.author.id);
            ReplyStart = "Profile Updated!";
        }
        fs.writeFileSync(`${PlayerPath}/${link_code}.json`, JSON.stringify(Full_Player_Information));

        // Invalidate cached version of the player.
        global.playerCache[link_code] = undefined;
        message.reply(`${ReplyStart} Check the website to make sure it went through.`);

        // Rename the user to have their name as their username.
        message.member.setNickname(playerInfo.Player, "Changed user's nickname to match their registered name.")
            // Send them a message if it failed.
            .catch(() => 
                message.channel.send(`I tried to rename you but I can't because I don't have permission; If you could please rename yourself to \`${Full_Player_Information.Name}\`, That'd be great.`)
            );
    }

    // Handles starting events.
    if (c.startsWith("/createEvent") && !message.channel.isThread()) {
        // Use the spawner's ID as the index in the event thread cache.
        let ThreadID;
        do {
            ThreadID = Math.floor(Math.random() * 9999);
        } while (global.ThreadCache[ThreadID] != null)

        global.ThreadCache[ThreadID] = message.channel.threads.create({
            name: `${ThreadPrefix}${ThreadID}`,
            autoArchiveDuration: 60,
            reason: 'Tracking ESports Event.',
        });
        let thread = await global.ThreadCache[ThreadID];

        // Join thread and tell the user that we're watching it.
        thread.send("I'm tracking an ESports Event in this thread. Make sure to use `/complete` when you're done, or your attendance may be lost!\nAlso, use `/addGame *` to add the games that are taking place today, please.\nIf you forgot, you can add people using `/here *`.")
            // .then(message => console.log(`Sent message: ${message.content}`))
            .catch(console.error);

        // Tell the user to enter the thread to begin logging attendance.
        message.reply("Enter the above thread in order to begin tracking attendance.")

        // Create event in cache.
        let date = new Date();
        let today = date.toISOString().slice(0, 10).replaceAll("-", "/");
        let hours = date.getHours();
        let minutes = date.getMinutes().toString();
        while (minutes.length < 2) minutes = "0" + minutes;
        global.EventCache[ThreadID] = {
            "Attending": [],
            "Excused": [],
            "Date": today,
            "StartTime": `${hours}:${minutes}`,
            "Games": []
        }

        // Add the current user to be attending, if they're registered.
        let userID = GetPlayerIDFromDiscordID(message.author.id);
        if (userID != -1)
            global.EventCache[ThreadID].Attending.push(userID);
        else 
            message.channel.send("I tried to add you to the attendance, but it doesn't appear that you're registered.");

        console.log(`Created a new event: ${thread.name}.`);
    } else if (c.startsWith("/createEvent"))
        message.reply("You can't create events in a thread!");

    // Allow Discord users to log games.
    /*
    let logGamePrefix = "/logGame";
    if (c.startsWith(logGamePrefix)) {
        let args = c.substring(logGamePrefix.length).trim().split(", ");
        let teamName = args[0];
        let enemies = args[1];
        let result = args[2];
        let date = new Date().toISOString().slice(0, 10).replaceAll("-", "/");
        
        // Set players equal to the rest of the arguments.
        let players = [];
        for (let i = 3; i < args.length; i++) {
            players.push(GetPlayerIDFromDiscordID(args[i]));
        }

        let data = JSON.stringify({
            TeamName: teamName,
            Players: players,
            Enemies: enemies,
            Result: result,
            DateOfMatch: date
        })

        // Save match.
        let MatchNum = -1;
        do {
            MatchNum = Math.floor(Math.random() * 999999);
        } while (fs.existsSync(`${GamesPath}/${MatchNum}.json`));

        fs.writeFileSync(`${GamesPath}/${MatchNum}.json`, data);

        // Tell the user that the match should be visible now.
        message.reply("Game registered! It should be visible on the website now.");
    }
    */

    // Handle commands which only run in a thread.
    else if (message.channel.isThread()) {
        let eventNumber = -1;
        try {
            // Extract event number.
            eventNumber = message.channel.name.split(" ");
            eventNumber = eventNumber[eventNumber.length - 1];

            // If the eventNumber isn't a valid event, return since this isn't an event thread.
            if (!global.EventCache[eventNumber] && c.startsWith("/")) 
                return message.reply("This isn't an event thread, you can't use event commands here!");
            // console.log("The event number in this thread is " + eventNumber);
        } catch (error) {
            // This is not an event thread.
            return false;
        }
        
        if (c.startsWith("/here")) {
            // Find event cache.
                // Asertain command args.
            let newPlayers = c.split(" ");
                // Remove the command.
            newPlayers.shift();

            let PlayersAttached = "";
            let errors = "\n\n";
            newPlayers.forEach(NewPlayer => {
                let trimPlayer = NewPlayer.trim();
                if (trimPlayer != "" || trimPlayer != "/here") {
                    let playerID = GetPlayerIDFromDiscordID(NewPlayer);
                    if (playerID != -1) {
                        global.EventCache[eventNumber].Attending.push(playerID);
                        PlayersAttached += `, ${NewPlayer}`;
                    } else {
                        errors += `${NewPlayer} is not registered!\n`;
                    }
                }
                
            });

            if (errors != "\n\n") errors += `\nPlease have the unregistered player${newPlayers.length > 1 ? "s" : ""} register at https://micahb.dev/ESports_Projects/Attendance_Make_Player.html\nand then you can add them via /here.`
            let msgStart = "";

            if (PlayersAttached != "") msgStart = `Player${newPlayers.length > 1 ? "s" : ""} attached: ${PlayersAttached.substring(1).trim()}!`
            else msgStart = "No players attached!";

            message.reply(`${msgStart}${errors != "\n\n" ? errors : ""}`);
            console.log(JSON.stringify(global.EventCache[eventNumber]));
        }
        
        else if (c.startsWith("/excuse")) {
            // Find event cache.
                // Asertain command args.
            let newPlayers = c.split(" ");
                // Remove the command.
            newPlayers.shift();

            // Add the player and their excuse.
            let Player = GetPlayerIDFromDiscordID(newPlayers[0]);
            let Excuse = newPlayers.length > 2 ? c.substring(c.indexOf(newPlayers[0]) + newPlayers[0].length).trim() : "did not provide an excuse but was excused by the person taking attendance.";

            // Add the player-excuse object to the event.
            if (Player != -1)
                global.EventCache[eventNumber].Excused.push({ "player": Player, "excuse": Excuse });
            else 
                return message.reply(`Please have the unregistered player register at https://micahb.dev/ESports_Projects/Attendance_Make_Player.html\nand then you can add them via /excuse.`);

            message.reply(`Player excused!`);
            // console.log(JSON.stringify(global.EventCache[eventNumber]));
        }
        // Handle finishing events.
        else if (c.startsWith("/complete")) {
            let data = global.EventCache[eventNumber];

            // Add the ending time.
            let date = new Date();
            let hours = date.getHours();
            let minutes = date.getMinutes().toString();
            // Prepend zeroes if minutes is just one digit.
            while (minutes.length < 2) minutes = "0" + minutes;
            
            data.EndTime = `${hours}:${minutes}`;

            console.log(data);

            // Write the file in.
            fs.writeFileSync(`${EventPath}/${eventNumber}.json`, JSON.stringify(data));

            // Tell the user that the event was closed, then archive the channel.
                // Note that I use setTimeout() here because there was an issue where the bot would send in an already-archived thread, just due to netstuff.
            message.reply("Event closed, you should now be able to see it on the website.")
                .then(() => {
                    message.channel.setArchived(true)
                });
        }

        else if (c.startsWith("/addGame")) {
            let Game = c.substring(c.indexOf(" ") + 1);
            global.EventCache[eventNumber].Games.push(Game);
            message.reply(`Game attached: ${Game}!`);
        }
    }
});

const ThreadPrefix = "Event Thread ";

if (global.playerCache == null) global.playerCache = {};
if (global.ThreadCache == null) global.ThreadCache = {};
if (global.EventCache == null) global.EventCache = {};
client.login(botInfo.token);