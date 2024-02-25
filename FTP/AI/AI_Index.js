// Create a cache for image components.
let ComponentCache = [];

function GetComponents(fileToRead) {
    if (ComponentCache[fileToRead] != null) 
        return ComponentCache[fileToRead];
    else if (fileToRead != null && fs.existsSync(fileToRead) && fileToRead.includes("AI")) {
        // Obtain the data from the file.
        let OGdata = fs.readFileSync(fileToRead).toString();
        if (DEBUG) 
            console.log("Read file for components parsing!")
        let data = OGdata;
        let start = data.indexOf("tEXt") + 4, end = data.indexOf(", Model hash: ");
        let promptText = data.substring(start, end);
        
        // Split the data into parts.
        /**
         * @type {String}
         */
        let parts = promptText.replaceAll("\x00", ": ").replaceAll("\x0A", ": ").replaceAll("\u00001", ": ");
        const values = parts.match(/(?<=\b\w+\:)(.*?)(?= \b\w+(?=:)\b)/g);
        const titles = parts.match(/\b\w+(?=:)\b/g);

        // Copy each part onto a JS object.
        let response = {};
        for (let i = 0; i < values.length; i++) {
            response[titles[i].replace(":", "").trim()] = values[i].trim();
        }

        // Patch inconsistent parameters labling.
        /*
        let parameters = data.substring(data.indexOf("tEXtparameters") + 15, data.indexOf("Negative"));
        response.parameters = parameters.trim();
        */
        if (DEBUG) 
            console.log(`Response: \n${response}`);
        
        // Cache the response, so that the next call can be sped up, then return it. 
        ComponentCache[fileToRead] = response;
        return response;
    }

    return {sucessful: false, reason: "File not Found!"};
}

async function PreloadPrompts(AI) {
    let fullAIPath = `FTP/AI/${AI}/`;
    // Get a list of files.
    let files = fs.readdirSync(fullAIPath)
    let prompts = [];

    fileLoop:
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        let file = files[fileIndex];

        let indexOfFinalUnderscore = file.lastIndexOf('_');
        let prompt = file.substring(0, indexOfFinalUnderscore);
        let ID = file.substring(indexOfFinalUnderscore + 1, file.length - 4);
        
        // Try to get the full list of tags.
        let tags = []
            // Get the tags properly if the AI is NovelAI.
        if (AI == "NovelAI")
            try {
                tags = GetComponents(fullAIPath + file).parameters;
            } catch (e) {
                // Do nothing.
            }

        if (tags == undefined) {
            let val = prompt.split(",");
            tags = val != null ? val : [prompt];
            for (let i = 0; i < tags.length; i++)
                tags[i] = tags[i].trim();
        }

        // console.log(`Prompt: ${prompt}\nTags: ${tags}`);

        for (let i = 0; i < prompts.length; i++) {
            let selectedPrompt = prompts[i];
            if (selectedPrompt.tags == tags) {
                selectedPrompt.images.push(ID);
                continue fileLoop;
            }
        }

        // If the selected file hasn't been matched, add its prompt.
        prompts.push({
            tags: tags,
            images: [ID]
        });
    }

    let response = {};
    response.prompts = prompts;
    response.sucessful = true;
    return response;
}

// Create a cache for the response from the GetPrompts.js module.
global.GetPromptsCache = [];

// On boot, rename any oddly-named files under the Stable Diffusion WebUI AIs (AbyssOrange, AnythingVn, NovelAI)
const fs = require('fs');
const path = require('path');
function RenameToPrompt(folder) {
    // Get a list of the images in that folder.
    let files = fs.readdirSync(folder);
    files.forEach(file => { 
        try {
            if (file != "Thumbs.db") {
                // If the file is oddly named (eg, consists of two blocks of numbers), rename it.
                let nameParts = file.split("_");
                if (nameParts.length > 2 || nameParts.length == 0) return;
                nameParts[1] = nameParts[1].substring(0, nameParts[1].length - 4);
                // console.log(`${file}: ${Number.isInteger(+nameParts[0])} ${Number.isInteger(+nameParts[1])}`)
                if (Number.isInteger(+nameParts[0]) && Number.isInteger(+nameParts[1])) {
                    let ActualDetails = GetComponents(`${folder}/${file}`);
                    // console.log(`Details of ${file}: ` + ActualDetails);
                    // Find the actual whole path.
                    let oldPath = path.resolve(`${folder}/${file}`);
                    let baseLength = oldPath.length - file.length;
    
                    /* 200 is relatively safe, probably */
                    let AddableCharacters = 200 - baseLength - `${ActualDetails.Seed}`.length;
    
                    // Create the new path.
                    let newPath = `./${folder}/${ActualDetails.parameters.substring(0, AddableCharacters)}_${ActualDetails.Seed}.png`;
                    let ForbiddenCharacters = `<>:"|?*`.split('');
                    ForbiddenCharacters.forEach(character => {
                        newPath = newPath.replaceAll(character, "");
                    });
    
                    console.log(`Renaming ${file} to ${newPath}!`);
                    fs.rename(oldPath, newPath, (e) => {if (e) {
                        console.log(e)
                    }})
                }
            }
        } catch (e) {
            // Do nothing.
        }
    });
}

/* We no longer need to run this on boot because it does it on upload now.
RenameToPrompt('./FTP/AI/AnythingV4.5/');
RenameToPrompt('./FTP/AI/AnythingV3/');
RenameToPrompt('./FTP/AI/NovelAI/');
*/