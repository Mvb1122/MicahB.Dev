// Loop through all of the ../Sets/ and return a list of their names and IDs.
const fs = require('fs');
const SetsDir = "Hiragana_Teacher/Sets/";
let lists = [];
fs.readdirSync(SetsDir).forEach((file) => {
    fileJSON = JSON.parse(fs.readFileSync(SetsDir + file));
    lists.push({ "Name": fileJSON.Name, "ID": file.substring(0, file.length - 5), "length": fileJSON.Set.length, "ObjectName": fileJSON.ObjectName});
})

res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
res.setHeader("Access-Control-Allow-Origin", "*");
res.end(JSON.stringify({
    "lists": lists
}));