// This is a not-in-use module that's sitting aside waiting for the number of images to get really really big, since it'll save size on larger numbers of images.

const fs = require('fs')
let AI = args.AI;
let response = { sucessful: false };
res.statusCode = 404;
if (AI != null) {
    // Get a list of files.
    let fullAIPath = `FTP/AI/${AI}/`;
    let files = fs.readdirSync(fullAIPath)
    let prompts = [];
    files.forEach(file => {
        let indexOfFinalUnderscore = file.lastIndexOf('_');
        let prompt = file.substring(0, indexOfFinalUnderscore);
        let ID = file.substring(indexOfFinalUnderscore + 1, file.length - 4);
    
        for (let i = 0; i < prompts.length; i++) {
            let selectedPrompt = prompts[i];
            if (selectedPrompt.promptName == prompt) {
                selectedPrompt.images.push(ID);
                return;
            }
        };

        // If the selected file hasn't been matched, add its prompt.
        prompts.push({
            promptName: prompt,
            tags: prompt.split(", "),
            images: [ID]
        });
    })

    response.prompts = prompts;
    res.statusCode = 200;
    response.sucessful = true;
}

res.end(JSON.stringify(response));