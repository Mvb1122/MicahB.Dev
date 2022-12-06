// This is a not-in-use module that's sitting aside waiting for the number of images to get really really big, since it'll save size on larger numbers of images.
const fs = require('fs')
let AI = args.AI;
let response = { sucessful: false };
res.statusCode = 404;

if (AI != null) {
    if (global.GetPromptsCache != undefined && global.GetPromptsCache[AI] != null)  {
        response = global.GetPromptsCache[AI];
        res.statusCode = 200;
    }
    else {
        // Get a list of files.
        let fullAIPath = `FTP/AI/${AI}/`;
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

        response.prompts = prompts;
        res.statusCode = 200;
        response.sucessful = true;
        global.GetPromptsCache[AI] = response;
    }
}

res.EndWithCompression(JSON.stringify(response));