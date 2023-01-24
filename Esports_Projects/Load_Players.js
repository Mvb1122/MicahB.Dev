async function LoadPlayers() {
    // Get list of players from server.
    let players;
    await fetch("https://micahb.dev/Esports_Projects/Modules/GetPlayers.js&cache=false")
        .then((response) => response.json())
        .then((data) => players = data);

    // Get each player and put it on a list.
    let list = `<table style="width:100%"><tr><th>Name</th><th>ID</th></tr>`;
    let NumberLoading = players.Players.length;

    players.Players.forEach(async (player) => {
        // Request each player's information.
        let playerURL = `https://micahb.dev/Esports_Projects/Players/${player}`;
        fetch(playerURL)
            .then((response) => response.json())
            .then((d) => {
                list += "<tr>" + `<td><a href="https://discord.com/users/${d.Discord_id}">${d.Name}</a></td><td>${d.Student_id}</td>` + "</tr>";
                NumberLoading--;
            });
    });

    while (NumberLoading != 0) {
        // Check once every 30ms if the stuff has finished loading, show percentage.
        let loadingPercentage = ((players.Players.length - NumberLoading) / (players.Players.length)) * 100;
        document.getElementById("Loading_Text").innerHTML = `Loading: ${loadingPercentage.toPrecision(4)}%`;
        await new Promise(r => setTimeout(r, 30));
    }

    document.getElementById("Loading_Text").innerHTML = `Registered Players:`; 
    document.getElementById("players").innerHTML = list + "</table>";

}

async function OnLoad() {
    // Load players but also get the list of games into the drop down.
    LoadPlayers();
    FillDropDownWithGames();
}

async function LoadPlayersFromGame() {
    // Get list of players from server.
    let players;
    let game = document.getElementById("game-selection").value.replaceAll("_", " ")

    // Load all players if that's which "game" is selected.
    if (game == "All") return LoadPlayers();

    await fetch("https://micahb.dev/ESports_Projects/Modules/GetPlayersWithGame.js&game=" + escape(game))
        .then((response) => response.json())
        .then((data) => players = data);

    console.log(players);

    // Put all the players on a list.
    let list = `<table style="width:100%"><tr><th>Name</th><th>ID</th></tr>`;

    players.players.forEach(player => {
        // Add each player to the table.
        list += "<tr>" + `<td><a href="https://discord.com/users/${player.Discord_id}">${player.Name}</a></td><td>${player.Student_id}</td>` + "</tr>";
    });

    document.getElementById("Loading_Text").innerHTML = `Registered Players:`; 
    document.getElementById("players").innerHTML = list + "</table>";
}

async function FillDropDownWithGames() {
    // Get the list of games from the server.
    let games;
    await fetch("https://micahb.dev/ESports_Projects/Modules/GetGames.js&cache=false")
        .then((response) => response.json())
        .then((data) => games = data);
    
    let list = `<option value="All">All Games</option>`;
    
    for (let game in games.games) {
        list += `\n<option value=${game.replaceAll(" ", "_")}>${game}</option>`
    }
    document.getElementById("game-selection").innerHTML = list;
}