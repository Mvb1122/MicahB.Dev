const player = args.id;

const fs = require('fs');

res.statusCode = 200;
res.setHeader("Content-Type", "application/json");

const path = `Esports_Projects/Players/${player}.json`;
if (player == null || !fs.existsSync(path)) {
    res.end(JSON.stringify({successful: false, reason: "Invalid ID!"}));
}

fs.readFile(path, (err, data) => {
    const output = JSON.parse(data);
    res.end(JSON.stringify({"Name": output.Name}));
})