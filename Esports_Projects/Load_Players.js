async function LoadPlayers() {
    // Get list of players from server.
    let players;
    await fetch("https://micahb.dev/Esports_Projects/Modules/GetPlayers.js&cache=false")
        .then((response) => response.json())
        .then((data) => players = data);

    // Get each player and put it on a list.
    let list = `<table style="width:100%"><tr><th>Name</th><th>ID</th></tr>`;
    let NumberLoading = players.Players.length;

    players.Players.forEach(player => {
        // Request each player's information.
        let playerURL = `https://micahb.dev/Esports_Projects/Players/${player}`;
        let data;
        fetch(playerURL)
            .then((response) => response.json())
            .then((d) => {
                list += "<tr>" + `<td><a href="https://discord.com/users/${d.Discord_id}">${d.Name}</a></td><td>${d.Student_id}</td>` + "</tr>";
                NumberLoading--;
            });
    });

    while (NumberLoading != 0) {
        // Check once every 500ms if the stuff has finished loading, show percentage.
        document.getElementById("Loading_Text").innerHTML = `Loading: ${(players.Players.length - NumberLoading / players.Players.length) * 100 / 2}%`;
        await new Promise(r => setTimeout(r, 500));
    }

    document.getElementById("Loading_Text").innerHTML = `Registered Players:`; 
    document.getElementById("players").innerHTML = list + "</table>";
}