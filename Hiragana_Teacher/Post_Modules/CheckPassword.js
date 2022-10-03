const fs = require('fs');

// Takes in a submitted user's data, and tells the client if it's right.
let submitted = JSON.parse(data);
let userFile = (await GetUserFile(submitted.username));
let check = CheckPassword(userFile, submitted);

res.statusCode = 200;
res.setHeader("Content-Type", "application/json");

res.end(JSON.stringify({ "correct": check }));