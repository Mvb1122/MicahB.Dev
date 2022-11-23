let player = args.player;

// Send the data back to the client.
res.setHeader("Content-Type", "application/json");
if (args.player) {
    res.statusCode = 200;
    let data = { winrate: GetWinrate(player)};
    data.sucessful = true;
    res.end(JSON.stringify(data));
} else {
    res.statusCode = 404;
    res.end(JSON.stringify({ sucessful: false }))
}
    