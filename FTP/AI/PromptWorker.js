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

function GetComponents(fileToRead) {
    if (ComponentCache[fileToRead] != null) return ComponentCache[fileToRead];
    else if (fileToRead != null && fs.existsSync(fileToRead) && fileToRead.includes("NovelAI")) {
        // Obtain the data from the file.
        let OGdata = fs.readFileSync(fileToRead).toString();
        let data = OGdata;
        let start = data.indexOf("tEXt") + 4, end = data.indexOf(", Model hash: ");
        let promptText = data.substring(start, end);
        
        // Split the data into parts.
        let parts = promptText.replace("\x00", ": ").replace("\x00", ": ").replace("\u00001", ": ").split('\n');

        // Process each part into its own parts. (Part name and content.)
        let partsParts = [[]];
        for (let i = 0; i < parts.length - 1; i++)
            partsParts[i] = parts[i].split(": ");

        // Split the last part into its parts.
        let compoundPart = parts[2].split(", ");
        for (let i = 0; i < compoundPart.length; i++)
            partsParts.push(compoundPart[i].split(": "));

        // Code each part onto a JS object.
        let response = {};
        partsParts.forEach(part => {
            response[part[0].replace(" ", "")] = part[1];
        });

        // Patch inconsistent parameters labling.
        /*
        let parameters = data.substring(data.indexOf("tEXtparameters") + 15, data.indexOf("Negative"));
        response.parameters = parameters.trim();
        */
        
        // Cache the response, so that the next call can be sped up, then return it. 
        ComponentCache[fileToRead] = response;
        return response;
    }
}

const { parentPort } = require('worker_threads');

parentPort.on('message', (msg) => { 
    console.log(msg)
    parentPort.postMessage(PreloadPrompts(msg))
});