async function loadPlayers(game) {
    // Get a list of players from the server.
    let data = await (fetch("https://micahb.dev/Esports_Projects/Modules/GetPlayersWithGameByNameAndFile.js&game=" + escape(game)).then(res => res.json()))
    // Add both players to both lists.
    let insides = [];

    data.players.forEach(player => {
        let option = document.createElement("option");
        option.value = player.file.substring(0, player.file.indexOf(".json"));
        option.text = player.Name;
        insides.push(option)
    });

    return insides;
}

async function loadGames() {
    let data = fetch("https://micahb.dev/Esports_Projects/Modules/GetGames.js")
    let GameSelector = document.getElementById("GameSeletor");
    document.getElementById("main").style.display = "flex";
    data.then(res => res.json()).then(data => {
        data.games = Object.keys(data.games);
        data.games.forEach(game => {
            let part = document.createElement("option")
            part.value = game;
            part.innerText = game;
            GameSelector.append(part)
        })
    })
}

async function loadSelectedGame() {
    let selectedGame = GetValueOfSelect("GameSeletor");

    if (selectedGame == "Super Smash Bros. Ultimate") {
        let insides = await loadPlayers(selectedGame);
        [ document.getElementById("PTopSelect"), document.getElementById("PBotSelect") ].forEach(select => {
            insides.forEach(row => 
                select.append(row.cloneNode(true))
            );
        })

        document.getElementById("SSBUMenu").style.display = "flex"
    } else {
        document.getElementById("ProcessingMenu").style.display = "block";
        document.getElementById("ProcessingText").outerHTML = "<h1>Game Not Implemented!</h1>"
    }
    document.getElementById("LoadGame").style.display = "none"
}

async function SubmitSSBUMatch() {
    let winners, losers;
    if (GetValueOfSelect("CompSelector") == "beat") {
        winners = GetValueOfSelect("PTopSelect");
        losers = GetValueOfSelect("PBotSelect");
    } else {
        winners = GetValueOfSelect("PBotSelect");
        losers = GetValueOfSelect("PTopSelect");
    }

    let MatchData = {
        "token": token,
        "Winners": [ winners ],
        "Losers": [ losers ],
        "Options": {
            "TeamName": null
        }
    }

    // Go to Processing Screen while sending the data.
    let response = postJSON("https://micahb.dev/Esports_Projects/Post_Modules/LogMatch.js&cache=false", MatchData);
    document.getElementById("ProcessingMenu").style.display = "block";
    document.getElementById("LeaveProcessingScreenButton").style.display = "block";
    document.getElementById("SSBUMenu").style.display = "none";
    response.then((resp) => {
        if (resp.sucessful) {
            document.getElementById("ProcessingText").outerHTML = "<h1>Match Submitted!</h1>";
        } else {
            document.getElementById("ProcessingMenu").innerHTML = "<h1>Something went wrong, please reload the page!</h1>";
        }
    })
}

// Return to the user's previous screen.
function LeaveProcessingScreen() {
    document.getElementById("ProcessingMenu").style.display = "none";
    loadSelectedGame();
}

function GetValueOfSelect(dropdownID) {
    return document.getElementById(dropdownID).value;
}

let ClickCounter = 0;
function IncreaseLogMatchCounter() {
    ClickCounter++;

    if (ClickCounter == 20) {
        let selector = document.getElementById("CompSelector");
        selector.innerHTML = selector.innerHTML.replace("won against", "absolutely demolished the goobers on the enemy team so thoroughly, they do not care where they are from, they will look them up and fuck their mothers, they have won against")
            .replace("lost to", "has absolutely failed their team and this club, they have gotten demolished by the other team and now am a goober. By tradition they shall fuck my mother. I have lost against");
    }
}