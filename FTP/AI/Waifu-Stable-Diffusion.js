let prompts = [];

async function loadAIImages(AI) {
    prompts = [];

    // Get a list of prompts.
    fetch(`./Modules/Get${AI}Files.js&cache=false`).then(res => res.json()).then(json => {
        // Find common prompts.
        json.files.forEach(file => {
            // Ascertain information about each image.
            let indexOfFinalUnderscore = file.lastIndexOf('_');
            let prompt = file.substring(0, indexOfFinalUnderscore);
            let ID = file.substring(indexOfFinalUnderscore + 1, file.length - 4);
        
            // Group common-name prompts together.
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
        });

        // Fill the PromptSelector, show it.
        let options = "";
        for (let i = 0; i < prompts.length; i++) {
            let prompt = prompts[i];
            options += `<option value="${i}">${prompt.promptName.replace("\\", "")}</option>`;
        }
        
        document.getElementById("PromptSelector").innerHTML = options;
        document.getElementById("PromptList").hidden = false;
    })
}

async function loadImagesFromPrompt(AI, Prompt) {
    // If we're trying to filter NSFW stuff, restrict to images with less than 7 tags which don't include any of the NSFW tags.
    let tryToFilter = false;
    let MaxTagLength = Infinity;
    let NSFWTags = ["sex", "cum", "nsfw", "breasts", "nude", "creampie", "spread_legs", "overflow", "vaginal"]
    if (document.getElementById("NSFWSwitch").checked) { 
        tryToFilter = true;
        MaxTagLength = 7;
    }

    let PromptRequestsSpecificPrompt = Prompt[0] == '_'
    if (PromptRequestsSpecificPrompt) {
        Prompt = Prompt.substring(1)
        let tagsWhichMustBeIncluded = Prompt.indexOf(",") != -1 ? Prompt.split(",") : [Prompt];
        let applicablePrompts = [];

        promptsLoop:
        for (let promptIndex = 0; promptIndex < prompts.length; promptIndex++) {
            let prompt = prompts[promptIndex];
            // If this prompt doesn't contain all of the expected tags, remove it. 
            let tagsWhichMatch = 0;

            if (tryToFilter)
                for (let i = 0; i < prompt.tags.length; i++) {
                    let tag = prompt.tags[i]
                    for (let i = 0; i < NSFWTags.length; i++) {
                        let notAllowedTag = NSFWTags[i];
                        if (tag.toLowerCase().trim().includes(notAllowedTag))
                        {
                            console.log(`Excluding ${prompt.promptName} because it includes NSFW tags!`);
                            continue promptsLoop;
                        }
                    }
                }

            // Only process a prompt if it has less than the maximum number of tags.
            if (prompt.tags.length < MaxTagLength)
                tagsWhichMustBeIncluded.forEach(mustBeIncludedTag => {
                    mustBeIncludedTag = mustBeIncludedTag.toLowerCase().trim();
                    prompt.tags.forEach(tagInPossiblePrompt => {
                        if (tagInPossiblePrompt.toString().toLowerCase().includes(mustBeIncludedTag))
                            tagsWhichMatch++;
                    });
                })
            if (tagsWhichMatch >= tagsWhichMustBeIncluded.length) applicablePrompts.push(prompt);
        };
        // console.log("Applicable Prompts: " + applicablePrompts.toString())
        Prompt = applicablePrompts;
    } else {
        console.log(`AI: ${AI}\nSpecific Prompt: ${prompts[Prompt].promptName}`);
        Prompt = [prompts[Prompt]];
    }
    
    document.getElementById("ImageList").innerHTML = "";
    
    let num = 0;
    Prompt.forEach(IncludedPrompt => {
        IncludedPrompt.images.forEach(image => {
            let im = document.createElement("img");
            im.alt = `${IncludedPrompt.promptName}`
            im.addEventListener("load", function() {
                im.style.height = "auto";
            })

            im.src = `./${AI}/${IncludedPrompt.promptName}_${image}.png`;

            if (num < 3) {
                im.loading = "eager";
                num++;
            } else {
                im.loading = "lazy";
            }

            // When the image is clicked, alert the user of the image's prompt.
            im.addEventListener("click", (click) => {
                fetch(`./Modules/GetCompoments.js&target=FTP/AI/${AI}/${IncludedPrompt.promptName}_${image}.png`).then(res => res.json())
                    .then(res => {
                        alert("Full Prompt: \n" + res.parameters)
                        console.log("Requested image data:")
                        console.log(res);
                    })
            })

    
            im.className = "FullSizeImage";
            document.getElementById("ImageList").appendChild(im);
        })
    });
    
    document.getElementById("ImageList").hidden = false;
}

// Make it so that, when the enter key is pressed and the search box is focused, the search is run.
window.onkeypress = function(event) {
    if (event.key == "Enter" && document.getElementById("searchBox") == document.activeElement) {
       document.getElementById("SearchButton").onclick();
    }
}

// Make it so clicking on the NSFW Filter label toggles the switch.
document.getElementById("NSFWSwitchLabel").addEventListener("click", (click) => {
    document.getElementById("NSFWSwitch").checked = !document.getElementById("NSFWSwitch").checked
})