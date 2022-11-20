const fs = require('fs');
let fileToRead = args.target;
let response = { sucessful: false }
res.statusCode = 404;
// This module only works on files that exist, which came from NovelAI.
try {
    if (fileToRead != null && fs.existsSync(fileToRead) && fileToRead.includes("NovelAI")) {
        let OGdata = fs.readFileSync(fileToRead).toString();
        let data = OGdata;
        let start = data.indexOf("tEXt") + 4, end = data.indexOf(", Model hash: ");
        let promptText = data.substring(start, end);
        let parts = promptText.replace("\x001", ": ").replace("\u00001", ": ").split('\n')
        let partsParts = [[]];
        for (let i = 0; i < parts.length - 1; i++)
            partsParts[i] = parts[i].split(": ");
    
        let compoundPart = parts[2].split(", ")
        for (let i = 0; i < compoundPart.length; i++)
            partsParts.push(compoundPart[i].split(": "))
    
        partsParts.forEach(part => {
            response[part[0].replace(" ", "")] = part[1];
        })
    
        // Patch inconsistent parameters labling.
        let parameters = data.substring(data.indexOf("tEXtparameters") + 15, data.indexOf("Negative"));
        response.parameters = parameters.trim()
    
        res.statusCode = 200;
        response.sucessful = true;
    }
} catch (e) {
    response.err = e;
} finally {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(response));
}