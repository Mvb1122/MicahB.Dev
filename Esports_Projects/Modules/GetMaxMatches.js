// Requires a "game" arg.
let response = { sucessful: false };
const { GetMaxMatches } = require("./Esports_Projects/Esports_Index.js")
res.statusCode = 403;
if (args.game != null) {
    let data = GetMaxMatches(args.game);
    Object.keys(data).forEach(key => {
        response[key] = data[key];
    })
    res.statusCode = 200;
}

res.setHeader("Content-Type", "application/json");
res.end(JSON.stringify(response));