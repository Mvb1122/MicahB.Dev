let games = unescape(args.games).split(", ");
let player = unescape(args.name);

// Write that information down in the cache.
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
let token = AddPlayerToCache({ Player: player, Games: games});
res.end(JSON.stringify({ Token: token }));