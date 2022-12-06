const WebsiteURL = "https://micahb.dev/Esports_Projects/";

// Create a cache of players.
let PlayerCache = {};
async function GetFromPlayerCache(file) {
    if (PlayerCache[file] != null)
        return PlayerCache[file];
    else {
        PlayerCache[file] = await fetch(`${WebsiteURL}Players/${file}`)
            .then((response) => response.json());
        
        return PlayerCache[file];
    }    
}

async function SetDropDown() {
    // Get list of players from server.
    let players = await fetch(WebsiteURL + "Modules/GetPlayersByNameAndFile.js&cache=false")
        .then((response) => response.json())

    // Add each player to an options list.
    let list = "";

    // Add an option for overall attendance, if this is the attendance page.
    if (document.URL.includes("Attendance_Attendance.html"))
        list += "<option value=\"summary\">Summary</option>"

    players.players.forEach(player => {
        // Collate that all into a list.
        list += `<option value="${player.file}">${player.playerName}</option>`
    });

    document.getElementById("Loading_Text").hidden = true; 
    document.getElementById("player-names").innerHTML = list;
}

function ArrayContains(array, val) {
    for (let i = 0; i < array.length; i++)
        if (array[i] == val) return true; 
    return false;
}

async function LoadPlayerFromDropDown() {
    // Get the specified player's information from the server.
    const player = document.getElementById("player-names").value;
    let data;

    // If it's overall, use that function instead.
    console.log(`Player: "${player}"`);
    // Load the user's data.
    await fetch(`${WebsiteURL}Players/${player}`)
        .then((response) => response.json())
        .then((d) => data = PlayerCache[player] = d);
    console.log(PlayerCache);

    // Get the matches they were in.
    let playerID = player.substring(0, player.indexOf("."));
    await fetch(`${WebsiteURL}Modules/GetMatches.js&player=${playerID}`)
        .then((response) => response.json())
        .then((d) => {
            data.Games = d.Matches;
        });

    // Change the loading text back to show that the thing is loading again, hide the drop-down.
    document.getElementById("Loading_Text").hidden = false; 
    document.getElementById("Loading_Text").innerText = "Loading Matches: 0%"; 
    document.getElementById("Selection_Helpers").hidden = true;

    // Load the player's matches.
    let GameData = data.Games

    // Set Text once all the things have been loaded.
    document.getElementById("Loading_Text").hidden = true; 
    document.getElementById("MatchDisplay").hidden = false;

    // PlayerName has XX Matches, here are the details:
    let PlayerFirstName = data.Name.substring(0, data.Name.indexOf(' '));
    document.getElementById("Match Display Title").innerHTML = `${PlayerFirstName} has ${GameData.length} match${GameData.length != 1 ? "es" : ""}. Here are the details:`;

    // Fetch winrate information.
    let winrate = await fetch(`${WebsiteURL}Modules/GetWinrate.js&player=${playerID}`).then(res => res.json());
    winrate = Math.floor(winrate.winrate * 10000) / 100

    // Make the text to show on screen.
    let output = `Winrate: ${winrate}%`;
    let MatchNumber = 0;
    GameData.forEach(async Game => {
        // Make the Text Green if they won and red if they lost.
        let textClass;
        let DidPlayerWin = ArrayContains(Game.Players, playerID)
        if (DidPlayerWin) 
            textClass = "greenText"
        else
            textClass = "redText"

        let heading = `<h2 class="${textClass}">Match #${++MatchNumber}: ${DidPlayerWin ? "Win" : "Loss"}</h2>`;

        let TeamMembers = "";
        let NumberProcessing = Game.Players.length + Game.Enemies.length;
        Game.Players.forEach(async player => {
            let playerInfo = await GetFromPlayerCache(`${player}.json`)
            TeamMembers += playerInfo.Name + ", "
            NumberProcessing--;
        })
        
        let Enemies = "";
        Game.Enemies.forEach(async player => {
            let playerInfo = GetFromPlayerCache(`${player}.json`)
            Enemies += (await playerInfo).Name + ", "
            NumberProcessing--;
        })

        do {
            console.log(NumberProcessing);
            await new Promise(resolve => setTimeout(resolve, 50))
        } while (NumberProcessing != 0)

        TeamMembers = TeamMembers.substring(0, TeamMembers.length - 2);
        Enemies = Enemies.substring(0, Enemies.length - 2);
        let text = `This game was between ${TeamMembers} and ${Enemies}. `
        
        // Determine whether the specified player was on the winning team or not.
        if (!DidPlayerWin)
            text += `Unfortunately, ${PlayerFirstName} lost this game.`
        else text += `${PlayerFirstName} won this game.`

        output += heading + text;
        document.getElementById("Match Display").innerHTML = output;
    });
}

function ResetWinratePage() {
    document.getElementById("Loading_Text").hidden = true; 
    document.getElementById("Loading_Text").innerText = ""; 
    document.getElementById("Selection_Helpers").hidden = false;
    document.getElementById("MatchDisplay").hidden = true;
}