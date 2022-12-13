const fs = require('fs');
let fileToRead = args.target;
let response = { sucessful: false }
res.statusCode = 404;
// This module only works on files that exist, which came from NovelAI.
try {
    let values = GetComponents(fileToRead);
    Object.keys(values).forEach(key => {
        response[key] = values[key];
    })

    res.statusCode = 200;
    response.sucessful = true;
} catch (e) {
    response.err = e.toString();
    console.log(e);
} finally {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(response));
}