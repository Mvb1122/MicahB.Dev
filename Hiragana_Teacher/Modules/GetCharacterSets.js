// Loop through all of the ../Sets/ and return a list of their names and IDs.
const fs = require('fs');
const SetsDir = "Hiragana_Teacher/Sets/";
/**
 * @type {{Name: String;ID: String;length: String;ObjectName: String;author: String;}[]}
 */
let lists = [];
fs.readdirSync(SetsDir).forEach((file) => {
    fileJSON = JSON.parse(fs.readFileSync(SetsDir + file));
    if (fileJSON.Visibility == "public") {
        let list = { "Name": fileJSON.Name, "ID": file.substring(0, file.length - 5), "length": fileJSON.Set.length, "ObjectName": fileJSON.ObjectName, "author": fileJSON.Author};
        lists.push(list);
    }
})

// Sort lists by name alphabetically, but keep the first 10 in order.
    // First, sort by file name.
lists.sort((a, b) => { return a.ID - b.ID});
let pastTen = lists.slice(10).sort((a, b) => {
    // Sort alphabetically using string localecompare. 
    return a.Name.localeCompare(b.Name);
})
lists = lists.slice(0, 10).concat(pastTen);

res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
res.setHeader("Access-Control-Allow-Origin", "*");
res.end(JSON.stringify({
    "lists": lists
}));