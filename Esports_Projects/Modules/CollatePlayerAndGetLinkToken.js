let games = unescape(args.games).split(", ");
let player = unescape(args.name);
let id = unescape(args.id);

// Write that information down in the cache.
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
let token = AddPlayerToCache({ Player: player, Games: games, Id: id});
res.end(JSON.stringify({ Token: token }));