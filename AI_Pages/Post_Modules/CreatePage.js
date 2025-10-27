/* Params: 
    data: string; // Data to be written as one HTML file.
    title: string; // Title of the page.
    update: boolean; // Whether this is replacing a previous page. If so, will use old link.

    Returns:
     successful: boolean; // Whether it succeded or not.
     reason: string // Error explainer text. Absent if successful. 
     location: string; // Where the server decided to put it. May not be obviously related to the title.
*/


// This module is just kinda... Maybe I shouldn't have it...
const dirName = 'AI_Pages';
const fs = require('fs');
const crypto = require('node:crypto')

/**
 * Creates a unique name by the title of the site.
 * @param {string} title Name of site.
 * @param {boolean} update Whether to generate same link everytime.
 * @returns {string} Name of site hashed with random number if updating.
 */
function CreateName(title, update = false) {
    let suffix = "";
    if (!update) {
        // Create a new link by assigning suffix a random number between 0-10000. Shouldn't overlap within reason. 
        suffix = Math.floor(Math.random() * 10000)
    }

    const content = `${title}${suffix}`;
    return crypto.createHash('md5').update(content).digest('hex');
}

const recordPath = "./AI_Pages/record.json"
function addTitleToRecord(title, file) {
    // Read record file. 
    /**
     * @type {{records: [{title: string, file: string}]}}
     */
    let records = { records: [] };
    if (fs.existsSync(recordPath)) records = JSON.parse(fs.readFileSync(recordPath));

    // Add values.
    records.records.push({
        title: title,
        file: file
    });

    // Write out. 
    fs.writeFileSync(recordPath, JSON.stringify(records));
}

// Sends fail response with reasoning.
function fail(reason) {
    res.statusCode = 403;
    res.end(JSON.stringify({sucessful: false, reason: reason }));
}

res.setHeader("Content-Type", "application/json");

// First things first, try to parse data into JSON. 
try {
    data = JSON.parse(data);
} catch {
    return fail("Data not in correct JSON format.");
}

if ('data' in data && 'title' in data && 'update' in data) {
    // Has all necessary fields.
    const fileName = CreateName(data.title, data.update) + ".html";

    // Data length check.
    if (data.data.length >= 10000) {
        return fail("Data too long.");
    } else {
        // Should be okay to write.
        fs.writeFile("./AI_Pages/" + fileName, data.data, () => {
            // Send successful response back.
            res.statusCode = 200;
            res.end(JSON.stringify({sucessful: true, location: dirName + "/" + fileName }));

            // Add title to record.
            addTitleToRecord(data.title, fileName);
            return; 
        })
    }
} else {
    return fail("Missing required fields on post data. Input recieved: " + JSON.stringify(data));
}