const fs = require('fs');

// Get a list of the files in the AI/WD directory.
fs.readdir("FTP/AI/AnythingV4.5/", (err, files) => {
    let onlyImages = [];
    for (let file in files) {
        file = files[file];
        let lcf = file.toString().toLowerCase();
        if (lcf.includes("png") || lcf.includes("jpg"))
            onlyImages.push(file);
    }

    let response = {
        "files": onlyImages
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify(response));
})