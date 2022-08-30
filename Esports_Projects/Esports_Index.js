const fs = require('fs');
const { Client, GatewayIntentBits, DiscordAPIError, } = require('discord.js');

global.playerCache = [];

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
        let data = JSON.parse(fs.readFileSync(`${PlayersPath}/${file}`));
        console.log(`\tData: ${data}\n\tID: ${DiscordID}\n\tCheck: ${data.Discord_id == DiscordID.toString()}`);
        if (data.Discord_id == DiscordID.toString())
            output = file.toString().split(".")[0];
    })
    return output;
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

client.once('ready', () => {
	console.log('Discord bot online.');
});

const PlayerPath = "Esports_Projects/Players"

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
            "Student_id": playerInfo.Id
        }
            // Saves data to player database.
        fs.writeFileSync(`${PlayerPath}/${link_code}.json`, JSON.stringify(Full_Player_Information));

        // Invalidate cached version of the player.
        global.playerCache[link_code] = undefined;
        message.reply("Registration suceeded! Check the website to make sure it went through.");

        // Rename the user to have their name as their username.
        message.member.setNickname(playerInfo.Player, "Changed user's nickname to match their registered name.")
            // Send them a message if it failed.
            .catch(error => 
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
            "Date": today,
            "StartTime": `${hours}:${minutes}`,
            "Games": []
        }

        // Add the current user to be attending, if they're registered.
        let userID = GetPlayerIDFromDiscordID(message.author.id);
        console.log(userID);
        if (userID != -1)
            global.EventCache[ThreadID].Attending.push(userID);
        else 
            message.channel.send("I tried to add you to the attendance, but it doesn't appear that you're registered.");

        console.log(`Created a new event: ${thread.name}.`);
    } else if (c.startsWith("/createEvent"))
        message.reply("You can't create events in a thread!");

    // Handle logging games.
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

    // Handle commands which only run in a thread.
    if (message.channel.isThread()) {
        let eventNumber = -1;
        try {
            // Extract event number.
            eventNumber = message.channel.name.split(" ");
            eventNumber = eventNumber[eventNumber.length - 1];

            // If the eventNumber isn't a valid event, return since this isn't an event thread.
            if (!global.EventCache[eventNumber]) return message.reply("This isn't an event thread, you can't use /here, here.");
            // console.log("The event number in this thread is " + eventNumber);
        } catch (error) {
            // This is not an event thread.
            return false;
        }
        
        if (c.startsWith("/here")) {
            // Find event cache.
            let NewPlayer = c.split(" ")[1];
            global.EventCache[eventNumber].Attending.push(GetPlayerIDFromDiscordID(NewPlayer));
            message.reply(`Player attached: ${NewPlayer}!`);
            console.log(JSON.stringify(global.EventCache[eventNumber]));
        }

        // Handle finishing events.
        if (c.startsWith("/complete")) {
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
            setTimeout(() => {message.channel.setArchived(true)}, 2000)
        }

        if (c.startsWith("/addGame")) {
            let Game = c.substring(c.indexOf(" ") + 1);
            global.EventCache[eventNumber].Games.push(Game);
            message.reply(`Game attached: ${Game}!`);
        }
    }
});
const GamesPath = "Esports_Projects/Games"
const EventPath = "Esports_Projects/Events"
const ThreadPrefix = "Event Thread ";
global.ThreadCache = [];
global.EventCache = [];
client.login(botInfo.token);