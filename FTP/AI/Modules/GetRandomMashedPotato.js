let response = {"sucessful": false}

// Locate the Garlic Bread files.
const fs = require('fs');
let files = fs.readdirSync("./FTP/AI/SD/");
let breads = [];
for (let i = 0; i < files.length; i++) {
    if (files[i].includes("Mashed Potatoes"))
        breads.push(files[i]);
}
// Select a random bread.
let bread = breads[Math.floor(Math.random() * breads.length)];
response.bread = bread;
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
res.end(JSON.stringify(response));