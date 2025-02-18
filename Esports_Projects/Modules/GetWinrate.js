let player = args.player, game = args.game;
const { GetWinrate } = require("./Esports_Projects/Esports_Index.js")

// Send the data back to the client.
res.setHeader("Content-Type", "application/json");
if (args.player) {
    res.statusCode = 200;
    let data = { winrate: GetWinrate(player, game), successful: true};
    data.successful = true;
    res.end(JSON.stringify(data));
} else {
    res.statusCode = 404;
    res.end(JSON.stringify({ successful: false }))
}
    