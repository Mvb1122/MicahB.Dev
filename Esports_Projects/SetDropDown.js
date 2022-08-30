const WebsiteURL = "https://micahb.dev/Esports_Projects/";

// Create a cache of players.
let PlayerCache = [];

async function SetDropDown() {
    // Get list of players from server.
    let players;
    await fetch(WebsiteURL + "Modules/GetPlayers.js&cache=false")
        .then((response) => response.json())
        .then((data) => players = data);

    // Add each player to an options list.
    let list = "";
    let NumberLoading = players.Players.length;

    // Add an option for overall attendance, if this is the attendance page.
    if (document.URL.includes("Attendance_Attendance.html"))
        list += "<option value=\"summary\">Summary</option>"

    players.Players.forEach(player => {
        // Request each player's information.
        let playerURL = `${WebsiteURL}Players/${player}`;
        let data;
        fetch(playerURL)
            .then((response) => response.json())
            .then((d) => {
                data = d;
                console.log(data);
                NumberLoading--;

                // Save that player to the cache.
                PlayerCache[player] = data;
                list += `<option value="${player}">${d.Name}</option>`;
            });
    });

    while (NumberLoading != 0) {
        // Check once every 500ms if the stuff has finished loading, show percentage.
        await new Promise(r => setTimeout(r, 500));
        document.getElementById("Loading_Text").innerHTML = `Loading: ${(players.Players.length - NumberLoading / players.Players.length) * 100}%`;
    }

    document.getElementById("Loading_Text").hidden = true; 
    document.getElementById("player-names").innerHTML = list;

    console.log(PlayerCache)
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
        .then((d) => data = d);

    // Get the matches they were in.
    await fetch(`${WebsiteURL}Modules/GetMatches.js&player=${player.substring(0, player.indexOf("."))}`)
        .then((response) => response.json())
        .then((d) => {
            data.Games = d.Matches;
            console.log(data);
        });

    // Change the loading text back to show that the thing is loading again, hide the drop-down.
    document.getElementById("Loading_Text").hidden = false; 
    document.getElementById("Loading_Text").innerText = "Loading Matches: 0%"; 
    document.getElementById("Selection_Helpers").hidden = true;

    // Load the player's matches.
    let NumberLoading = data.Games.length;

    let GameData = [];
    data.Games.forEach(game => {
        // Request each Game's information.
        let playerURL = `${WebsiteURL}Games/${game}.json`;
        fetch(playerURL)
            .then((response) => response.json())
            .then((d) => {
                console.log(d);
                NumberLoading--;

                GameData.push(d);
            });
    });

    while (NumberLoading != 0) {
        // Check once every 500ms if the stuff has finished loading, show percentage.
        document.getElementById("Loading_Text").innerHTML = `Loading: ${(data.Games.length - NumberLoading / data.Games.length) * 100 / 2}%`;
        await new Promise(r => setTimeout(r, 500));
    }

    // Set Text once all the things have been loaded.
    document.getElementById("Loading_Text").hidden = true; 
    document.getElementById("MatchDisplay").hidden = false;

    // PlayerName has XX Matches, here are the details:
    let PlayerFirstName = data.Name.substring(0, data.Name.indexOf(' '));
    document.getElementById("Match Display Title").innerHTML = `${PlayerFirstName} has ${GameData.length} match${GameData.length != 1 ? "es" : ""}. Here are the details:`;

    // Calculate winrate.
    let wins, total = wins = 0;
    GameData.forEach(Game => {
        // Keep track of the total number of matches and wins. Ties do not count towards the total.
        if (Game.Result == "Win") {
            wins++; total++;
        }
        else if (Game.Result != "Tie") 
            total++;
    });
    let winrate = wins / total;

    // Make the text to show on screen.
    let output = `Winrate: ${winrate * 100}%`;
    let MatchNumber = 0;
    GameData.forEach(Game => {
        // Make the Text Green if they won or tied and red if they lost.
        let textClass;
        switch (Game.Result) {
            case "Win":
                textClass = "greenText"
                break;
            
            case "Loss":
                textClass = "redText"
                break;
            
            default:
                textClass = "yellowText"
                break;
        }

        let heading = `<h2 class="${textClass}">Match #${++MatchNumber}: ${Game.Result}</h2>`;
        let ListOfPeoplePlaying = "<ul>";
        Game.Players.forEach((player) => {
            // Use information from the cache to replace player's numbers with their names.
            ListOfPeoplePlaying +=`\t<li>${PlayerCache[`${player}.json`].Name}</li>`;
        });
        ListOfPeoplePlaying += "</ul>"

        let text = `This game was between our <i>${Game.TeamName}</i> and the <i>${Game.Enemies}</i>.<br>On ${PlayerFirstName}'s side, we had the following people playing:`
        + ListOfPeoplePlaying;

        output += heading + text;
    });
    document.getElementById("Match Display").innerHTML = output;
}

function ResetWinratePage() {
    document.getElementById("Loading_Text").hidden = true; 
    document.getElementById("Loading_Text").innerText = ""; 
    document.getElementById("Selection_Helpers").hidden = false;
    document.getElementById("MatchDisplay").hidden = true;
}