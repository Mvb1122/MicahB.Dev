const path = require('path');

if (args.target != null && !args.target.includes("modules")) {
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

    let location = `FTP/${unescape(args.target.replaceAll("$$DOT$$", ".").replaceAll("$$SLASH$$", "/"))}`//.replace(/[<>:"/\\|?*]/g, '');
    location = path.resolve(location);

    // If this is an AI file, attempt to rename it to use the standard naming scheme.
    if (location.includes("AI") && location.includes("FTP")) {
        // Get AI tools. 
        const AITools = require('./FTP/AI/PromptWorker.js');
        if (data.toString().includes("tEXt")) {
            try {
                // ! The below assumes that the file is a PNG!
                const components = await AITools.GetComponentsFromBuffer(data);
                const Path = location.substring(0, location.lastIndexOf(path.sep) + 1);
                const parameters = components.parameters;
                const maxLength = 200 - Path.length;
                let endIndex = Math.min(maxLength, parameters.length);
                location = `${Path}${parameters.substring(0, endIndex)}_${components.Seed}.png`//.replace(/[<>:"/\\|?*]/g, '');
            } catch (e) {
                // Do nothing, since that means that the image was malformatted and we just have to trust that the client named it correctly.
            }
        }
    }

    // If this file already exists, add a tag to its name.
    if (fs.existsSync(location)) {
        // Check that this isn't the second or more-th time that this file has been uploaded.
        let parts = location.split(".");
        let name = parts[parts.length - 2];

        // Attempt to figure out which upload number this is.
        let uploadNum = 1;

        numLoop:
        while (true) {
            let fullPath = "";
            let uploadTag = " (" + uploadNum + ")";

            fullPath = location.replace(name, name + uploadTag)

            if (fs.existsSync(fullPath))
                uploadNum++;
            else {
                location = fullPath;
                break numLoop;
            }
        }
    }

    let respose = { upload: location.toString() };
    if (DEBUG) console.log(`Uploading a file to: ${location}`)
    fs.writeFile(location, data, (err) => {
        console.log(`Wrote file to ${location}!`)
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");

        if (err) {
            respose.upload = err;
            console.log(err);
            return res.end(JSON.stringify(respose));
        }

        res.sucessful = true;
        res.end(JSON.stringify(respose));
    });
} else {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({sucessful: false, reason: args.target == null ? "No location provided." : "You are not authorized to write to this location."}));
}