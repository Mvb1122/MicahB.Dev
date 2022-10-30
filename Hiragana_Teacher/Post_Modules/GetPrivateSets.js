let GivenData = JSON.parse(data);
let token = TokenToUserID(GivenData.token);
let response = {
    sucessful: token != -1,
    sets: []
}

// Go through all the sets and add the private ones that the author has made to the list.
const fs = require('fs');
fs.readdir("Hiragana_Teacher/Sets/", (err, files) => {
    if (err) console.log(err);

    files.forEach(file => {
        let FileData = JSON.parse(fs.readFileSync(`Hiragana_Teacher/Sets/${file}`))
        if (FileData.Author == token && FileData.Visibility == "private")
            response.sets.push(
                { "Name": FileData.Name, "ID": file.substring(0, file.length - 5), "length": FileData.Set.length, "ObjectName": FileData.ObjectName, "author": FileData.Author}
            );
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify(response));
})