// Enumerate The American Journey chapters and return them.
const fs = require('fs');
let files = [];
fs.readdirSync('FTP').forEach(element => {
    // Only include files.
    if (fs.lstatSync('FTP/' + element).isFile() && element.startsWith("The_American_Journey"))
        files.push(element);
});
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
res.end(JSON.stringify({ "files": files }));