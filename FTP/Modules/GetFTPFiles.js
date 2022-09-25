// Enumerate files and send back a list.
const fs = require('fs');
let files = [];
fs.readdirSync('FTP').forEach(element => {
    // Only include files.
    if (fs.lstatSync('FTP/' + element).isFile())
        files.push(element);
});
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
res.end(JSON.stringify({ "files": files }));