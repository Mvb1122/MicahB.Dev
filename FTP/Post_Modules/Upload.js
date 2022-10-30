if (args.target != null) {
    const fs = require('fs');
    // Remove header stuff and write.
    if (data.includes("0D0A0D0A89504E47", 0, "hex")){
        console.log("Editing data to start properly.");
        let init = data.indexOf("0D0A0D0A89504E47", 0, "hex");
        console.log(`Initial start: ${init}`);
        let start = init + 4
        console.log(`Edited Data starts at: ${start} pos.`)
        data = data.subarray(start)
    }

    // If this is binary data, write it properly.
    let location = `FTP/${unescape(args.target.replaceAll("$$DOT$$", ".").replaceAll("$$SLASH$$", "/"))}`;
    fs.writeFile(location, data, (err) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        let respose = { upload: location };
        if (err) {
            respose.upload = err;
            console.log(err);
            return res.end(JSON.stringify(respose));
        }
        res.end(JSON.stringify(respose));
    });
} else {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({sucessful: false}));
}