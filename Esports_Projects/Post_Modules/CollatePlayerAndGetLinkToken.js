/*
let games = unescape(args.games).split(", ");
let player = unescape(args.name);
let id = unescape(args.id);

Example Data:
{
    "games": ["Super Smash Bros. Ultimate"]
    "player": "Micah Bushman",
    "id": 980003839,
    "grade": 12,
    "ranks": ["I dunno, like 3?"]
}
*/

// Write the given information down in the cache.
let GivenData = JSON.parse(data);
res.statusCode = 200;
const AddPlayerToCache = global.esports.AddPlayerToCache;
res.setHeader("Content-Type", "application/json");
let token = AddPlayerToCache({ Player: GivenData.player, Games: GivenData.games, Id: GivenData.id, Grade: GivenData.grade, Ranks: GivenData.ranks });
res.end(JSON.stringify({ Token: token }));