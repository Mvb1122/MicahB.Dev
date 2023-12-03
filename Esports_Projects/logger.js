async function loadPlayers(game) {
    // Get a list of players from the server.
    let data = await (fetch("./Modules/GetPlayersWithGameByNameAndFile.js&game=" + escape(game)).then(res => res.json()))

    // Add players to a list, which we can use to put them on the dropdowns.
        // Also, include the "null" player here, so that we can include matches with missing people.
    let NullOption = document.createElement("option");
    NullOption.value = "NULL";
    NullOption.text = "Empty Slot";

    let insides = [NullOption];

    data.players.forEach(player => {
        let option = document.createElement("option");
        option.value = player.file.substring(0, player.file.indexOf(".json"));
        option.text = player.Name;
        insides.push(option)
    });

    return insides;
}

async function loadGames() {
    let data = fetch("./Modules/GetGames.js")
    let GameSelector = document.getElementById("GameSelector");
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

let selectedGame = "";
let SourceScreen = "";
async function loadSelectedGame() {
    selectedGame = GetValueOfSelect("GameSelector");

    let rows = [];
    switch (selectedGame) {
        case "Super Smash Bros. Ultimate":
            rows = [ document.getElementById("PTopSelect"), document.getElementById("PBotSelect") ];
            await LoadRows(selectedGame, rows);
            document.getElementById("SSBUMenu").style.display = "flex"
            SourceScreen = "SSBUMenu"
            break;

        case "Mario Kart":
            await LoadMarioKartSplatoonPanel(selectedGame);
            document.getElementById("MapInput").placeholder = "Map (Can be empty)"
            break;

        case "Splatoon":
            await LoadMarioKartSplatoonPanel(selectedGame);
            document.getElementById("MapInput").placeholder = "Gamemode (Can be empty)"
            break;

        default:
            document.getElementById("ProcessingMenu").style.display = "block";
            document.getElementById("ProcessingText").outerHTML = "<h1>Game Not Implemented!</h1>"
            break;
    }

    document.getElementById("LoadGame").style.display = "none"
}

function GetWinrateUseCache(id) {
    return new Promise(async res => {
        // See if we have the player's winrate in cache.
        if (WinrateCache[id] != undefined) res({successful: true, winrate: WinrateCache[id]});
        else res(await fetch("./Modules/GetWinrate.js&player=" + id + "&game=" + escape(selectedGame)));
    })
        // For ourselves, add the value to the cache. 
        .then(value => {
            if (value.json != undefined) {
                return value.json().then(json => {
                    WinrateCache[id] = json.winrate;
                    return json;
                });
            }
            else return value;
        })
}

let UsernameCache = {};
function GetPlayerNameUseCache(id) {
    return new Promise(async res => {
        // See if we have the player's winrate in cache.
        if (UsernameCache[id] != undefined) res({sucessful: true, Name: UsernameCache[id]});
        else res(await fetch("./Modules/GetPlayerName.js&id=" + id));
    })
        .then(value => {
            if (value.json != undefined) {
                return value.json().then(json => {
                    UsernameCache[id] = json.Name;
                    return json;
                });
            }
            else return value;
        })
}

/**
 * Organized so WinrateCache[ID] = Winrate
 */
let WinrateCache = {}; 
async function LoadMarioKartSplatoonPanel(selectedGame) {
    let rows = GetSplatoonAndMarioKartSelects();
    await LoadRows(selectedGame, rows);
    document.getElementById("SplatMKMenu").style.display = "block";
    SourceScreen = "SplatMKMenu";

    // Attach listeners to the player slots.
    ["Top", "Bot"].forEach(half => {
        for (let i = 0; i < 4; i++) {
            const select = `P${half}Select${i}`, WinrateDisplay = `Player${half}Winrate${i}`;
            document.getElementById(select).addEventListener("change", (ev) => {
                // Set the respective players' winrate.
                const selectedUserId = ev.target.value;
                return GetWinrateUseCache(selectedUserId)
                    .then(json => {
                        if (json.successful && json.winrate != null) {
                            const winrate = (json.winrate * 100).toPrecision(3);
                            document.getElementById(WinrateDisplay).innerText = winrate + "%"
                        } else {
                            document.getElementById(WinrateDisplay).innerText = "";
                        }

                        // Update team winrate.
                        let teamMembers = [];
                        for (let p = 0; p < 4; p++) {
                            let TeamMemberId = document.getElementById(`P${half}Select${p}`).value;
                            teamMembers.push(GetWinrateUseCache(TeamMemberId));
                        }
                        
                        Promise.allSettled(teamMembers).then(async () => {
                            for (let i = 0; i < teamMembers.length; i++) teamMembers[i] = await teamMembers[i];
                            // Average them all.
                            let average = 0;
                            teamMembers.forEach(member => {
                                    average += member.winrate;
                            })
                            average /= 4.0;

                            document.getElementById(half + "Avg").innerText = (average * 100).toPrecision(3) + "%";
                            console.log(teamMembers);
                        })
                    })
            })
        }
    })
}

function GetSplatoonAndMarioKartSelects() {
    let top = GetSelectsByNumberAndPrefix(4, "PTopSelect");
    let bottom = GetSelectsByNumberAndPrefix(4, "PBotSelect");
    return top.concat(bottom);
}

function GetSelectsByNumberAndPrefix(num, side) {
    let rows = [];
    for (let i = 0; i < num; i++) {
        let select = `${side}${i}`;
        rows.push(document.getElementById(select));
    }
    return rows;
}

// Only loads rows if they aren't already filled.
async function LoadRows(selectedGame, rows) {
    let insides = await loadPlayers(selectedGame);
    rows.forEach(select => {
        if (select.options.length == 0)
            insides.forEach(row => 
                select.append(row.cloneNode(true))
            );
    });
}

function GetValueOfSelectArray(array) {
    let output = [];
    array.forEach(select => output.push(GetValueOfSelect(select.id)))
    return output;
}

async function SubmitSplatMKMatch() {
    let winners, losers;
    if (GetValueOfSelect("CompSelectorMKSplat") == "beat") {
        winners = GetValueOfSelectArray(GetSelectsByNumberAndPrefix(4, "PTopSelect"));
        losers = GetValueOfSelectArray(GetSelectsByNumberAndPrefix(4, "PBotSelect"));
    } else {
        winners = GetValueOfSelectArray(GetSelectsByNumberAndPrefix(4, "PBotSelect"));
        losers = GetValueOfSelectArray(GetSelectsByNumberAndPrefix(4, "PTopSelect"));
    }

    // Fetch the map input.
    let map = GetValueOfSelect("MapInput");

    let MatchData = {
        "token": token,
        "Winners": winners,
        "Losers": losers,
        "Options": {
            "TeamName": null,
            "Game": selectedGame,
            "Map": map == null ? null : map
        }
    }

    SubmitMatch(MatchData);
}

async function SubmitSSBUMatch() {
    let winners, losers, divs = {winner: "", loser: ""};
    if (GetValueOfSelect("CompSelector") == "beat") {
        winners = GetValueOfSelect("PTopSelect");
        losers = GetValueOfSelect("PBotSelect");
        divs.winner = "PTopSelect"; divs.loser = "PBotSelect";
    } else {
        winners = GetValueOfSelect("PBotSelect");
        losers = GetValueOfSelect("PTopSelect");
        divs.loser = "PTopSelect"; divs.winner = "PBotSelect";
    }

    let MatchData = {
        "token": token,
        "Winners": [ winners ],
        "Losers": [ losers ],
        "Options": {
            "TeamName": null,
            "Game": "Super Smash Bros. Ultimate"
        }
    }

    // Ask for matchups.
    const text = document.createElement("p");
        // Clear old matchups.
    document.getElementById("SmashMatchUps").innerHTML = "";
    document.getElementById("SmashMatchUps").appendChild(text)

    const parts = [{ id: winners, div: divs.winner }, {id: losers, div: divs.loser}]
    parts.forEach(player => {
        postJSON("./Post_Modules/GetSuggestedNextMatch.js&cache=false", {id: player.id}).then(val => {
            const text = document.createElement("p");
            if (!val.successful) {
                text.innerText = `Something went wrong!\nError: ${val.reason}`;
                document.getElementById("SmashMatchUps").appendChild(text);
                return;
            } else {
                const username = document.getElementById(player.div).options[document.getElementById(player.div).selectedIndex].text;
                
                const randomIndex = Math.floor(Math.random() * (val.Players.length));
                const randomPlayer = val.Players[randomIndex];
                GetPlayerNameUseCache(randomPlayer.substring(0, randomPlayer.indexOf(".json")))
                    .then(val => {
                        if (val.Name == username) val.Name = "Bye! (Please fight someone random!)"
                        text.innerText = `${username}'s next recommended matchup: ${val.Name}`
                        document.getElementById("SmashMatchUps").appendChild(text)
                    })
            }

        })
    })

    SubmitMatch(MatchData);
}

/**
 * Sends a match.
 * @param {{token: Number;Winners: any[];Losers: any[];Options: {TeamName: String;Game: string;};}} MatchData 
 * @returns Nothing.
 */
async function SubmitMatch(MatchData) {
    // Remove the null option from either part.
    let winners = [];
    MatchData.Winners.forEach(winner => {
        if (winner != "NULL")
            winners.push(winner);
    })

    let losers = [];
    MatchData.Losers.forEach(loser => {
        if (loser != "NULL")
            losers.push(loser)
    })

    MatchData.Losers = losers;
    MatchData.Winners = winners;

    // Make sure that both sides have at least one person before continuing.
    if (MatchData.Losers.length == 0 || MatchData.Winners.length == 0)
        return alert("You need more players! One of your sides is entirely empty.");

    // Go to Processing Screen while sending the data.
    let response = postJSON("./Post_Modules/LogMatch.js&cache=false", MatchData);

    document.getElementById("ProcessingMenu").style.display = "block";
    document.getElementById("LeaveProcessingScreenButton").style.display = "block";
    document.getElementById(SourceScreen).style.display = "none";
    response.then((resp) => {
        if (resp.successful) {
            document.getElementById("ProcessingText").outerHTML = "<h1>Match Submitted!</h1>";
        } else {
            document.getElementById("ProcessingMenu").innerHTML = "<h1>Something went wrong, please reload the page!</h1>";
        }
    })

    // After submitting a match, clear the winrate cache.
    WinrateCache = [];
}

// Return to the user's previous screen.
function LeaveProcessingScreen() {
    document.getElementById("ProcessingMenu").style.display = "none";

    // Also clear matchup display for Smash.
    document.getElementById("SmashMatchUps").children = [];

    loadSelectedGame();
}

function GetValueOfSelect(dropdownID) {
    return document.getElementById(dropdownID).value;
}

// Click the selector text 20 times for a special surprise...
let ClickCounter = 0;
function IncreaseLogMatchCounter() {
    ClickCounter++;

    if (ClickCounter == 20) {
        let selector = document.getElementById("CompSelector");
        selector.innerHTML = selector.innerHTML.replace("won against", "absolutely demolished the goobers on the enemy team so thoroughly, they do not care where they are from, they will look them up and fuck their mothers, they have won against")
            .replace("lost to", "has absolutely failed their team and this club, they have gotten demolished by the other team and now am a goober. By tradition they shall fuck my mother. I have lost against");
    }
}

function ReturnToGameSelect(OldMenuId) {
    document.getElementById(OldMenuId).style = "display: none";
    document.getElementById("LoadGame").style = "display: block";
    WinrateCache = [];
}