res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
let game = unescape(args.game).trim();

// Go through each player and determine the games.
let games = { players: GetPlayersWhoPlayGame(game) };

res.end(JSON.stringify(games));