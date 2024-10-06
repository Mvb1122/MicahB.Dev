let prompts = [];

async function loadAIImages(AI) {
    return new Promise((res) => {
        UpdatePageParams({"AI": AI});
        prompts = [];

        // Get a list of prompts.
        /* Generate prompts locally: */
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
                options += `<option value="${i}">${prompt.promptName.replaceAll("\\", "")}</option>`;
            }
            
            document.getElementById("PromptSelector").innerHTML = options;
            document.getElementById("PromptList").hidden = false;
            res();
        })
    })
}

let NSFWTags = ["sex", "cum", "nsfw", "breasts", "nude", "creampie", "spread_legs", "overflow", "vaginal", "cum on body"]

let ArrayIncludes = (array, value) => {
    // Make '_' and ' ' the same character, if we're dealing with strings.
    value = value.replace("_", " ").toLowerCase().trim();
    
    for (let i = 0; i < array.length; i++)
        if (array[i].toString().trim().toLowerCase().replace("_", " ").includes(value)) return true;
    return false;
}

let ArrayHasItem = (array, value) => {
    // Make '_' and ' ' the same character, if we're dealing with strings.
        // Because this function is used to search through tags, also remove '(' and ')' characters.
    value = value.replace("_", " ").replaceAll('(', "").replaceAll(')', "").toLowerCase().trim();

    
    for (let i = 0; i < array.length; i++)
        if (array[i].toString().trim().toLowerCase().replace("_", " ").replaceAll('(', "").replaceAll(')', "") == value) return true;
    return false;
}

let PassesFilter = (prompt) => {
    tryToFilter = document.getElementById("NSFWSwitch").checked;

    if (tryToFilter)
        for (let i = 0; i < NSFWTags.length; i++) {
            let tag = NSFWTags[i];
            if (ArrayHasItem(prompt.tags, tag)) {
                console.log(`Excluding ${prompt.promptName} because it includes NSFW tags!`);
                return false;
            }
        };

    return true;
}

async function loadImagesFromPrompt(AI, Prompt) {
    UpdatePageParams({"AI": AI, "Prompt": Prompt});
    // If we're trying to filter NSFW stuff, restrict to images with less than 15 tags which don't include any of the NSFW tags.
    let MaxTagLength = Infinity;
    if (document.getElementById("NSFWSwitch").checked) { 
        MaxTagLength = 15;
    }

    let PromptRequestsSpecificPrompt = Prompt[0] == '_'
    if (PromptRequestsSpecificPrompt) {
        Prompt = Prompt.substring(1)
        let tagsWhichMustBeIncluded = Prompt.indexOf(",") != -1 ? Prompt.split(",") : [Prompt];
        // Remove empty tags.
        let tags = [];
        tagsWhichMustBeIncluded.forEach(tag => {
            if (tag.trim() != "") tags.push(tag.trim());
        });
        tagsWhichMustBeIncluded = tags;

        let applicablePrompts = [];

        for (let promptIndex = 0; promptIndex < prompts.length; promptIndex++) {
            let prompt = prompts[promptIndex];

            // Only process a prompt if it passes the NSFW filter.
            if (PassesFilter(prompt)) {
                // If this prompt doesn't contain all of the expected tags, remove it. 
                let tagsWhichMatch = 0;
                if (prompt.tags.length < MaxTagLength)
                    tagsWhichMustBeIncluded.forEach(tag => {
                        if (ArrayIncludes(prompt.tags, tag))
                            tagsWhichMatch++;
                    });

                if (tagsWhichMatch >= tagsWhichMustBeIncluded.length) 
                    applicablePrompts.push(prompt);
            }
            
        };
        // console.log("Applicable Prompts: " + applicablePrompts.toString())
        Prompt = applicablePrompts;
    } else {
        console.log(`AI: ${AI}\nSpecific Prompt: ${prompts[Prompt].promptName}`);
        Prompt = [prompts[Prompt]];
    }
    
    document.getElementById("ImageList").innerHTML = "";
    
    let ImageLoadIndex = 0;
    Prompt.forEach(IncludedPrompt => {
        IncludedPrompt.images.forEach(image => {
            let im = document.createElement("img");
            im.alt = `${IncludedPrompt.promptName}`;

            // Preliminary height set.
                // Poll for the proper height until it's available. 
            const poll = setInterval(function () {
                if (im.naturalHeight) {
                    clearInterval(poll);
                    im.style.height = im.naturalHeight; im.style.width = im.naturalWidth;
                }
            }, 10);

            // Actual height set.
            im.addEventListener("load", function() {
                im.style.height = "auto";
            })

            // Default height + width for extreme close up images.
            if (IncludedPrompt.promptName.includes("extreme_close_up")) {
                im.style.height = "512px"; im.style.width = "512px";
            }

            // The data here is controlled by the server pretty much
            const fullresURL = `./${AI}/${IncludedPrompt.promptName}_${image}.png`;
            im.src = fullresURL + "&compress=true";

            if (ImageLoadIndex < 30) {
                im.loading = "eager";
                ImageLoadIndex++;
            } else {
                im.loading = "lazy";
            }

            // When the image is clicked, alert the user of the image's prompt.
            im.addEventListener("click", (click) => {
                fetch(`./Modules/GetCompoments.js&target=FTP/AI/${AI}/${IncludedPrompt.promptName}_${image}.png`).then(res => res.json())
                    .then(res => {
                        alert("Full Prompt: \n" + res.parameters)
                        console.log("Requested image data:");
                        console.log(res);

                        console.log("Does prompt pass NSFW filter? " + PassesFilter(IncludedPrompt));
                    })
            })

            // When the user hovers over the image, swap to the uncompressed version of the image.
            im.addEventListener('mouseover', () => {
                im.src = fullresURL;
                im.loading = "eager";
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
    UpdatePageParams({"NSFW": document.getElementById("NSFWSwitch").checked })
})

function parseQuery(queryString) {
    var query = { 
        has(value) {
            return this[value] != null;
        },   
        get(value) {
            return this[value].toString();
        }
    };

    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }

    return query;
}

async function ExtractInformationFromURL() {
    // Extract URL Parameters, load them into page variables.
    const params = parseQuery(location.href.substring(location.href.indexOf("?")));

    if (params.has("AI")) {
        document.getElementById(`AISelector`).value = params.get("AI");
        loadAIImages(document.getElementById(`AISelector`).value).then(() => {
            if (params.has("NSFW"))
                document.getElementById("NSFWSwitch").checked = params.get("NSFW");
        
            if (params.has("Prompt")) {
                document.getElementById(`searchBox`).value = params.get("Prompt").substring(1);
                loadImagesFromPrompt(document.getElementById(`AISelector`).value, `_` + document.getElementById(`searchBox`).value)
            }
        });
    }
}

let URLValues = {};
function UpdatePageParams(Values) {
    // Overwrite values in pre-existing URLValues object.
    Object.keys(Values).forEach(value => {
        URLValues[value] = Values[value];
    });

    console.log(URLValues);

    // Put all the values into the url.
    let queryString = "";
    Object.keys(URLValues).forEach(value => {
        queryString += `&${value}=${URLValues[value]}`;
    })

    let newUrl = `${window.origin}/FTP/AI/Waifu-Stable-Diffusion.html?${queryString}`;
    console.log(`Changed page url to ${newUrl}!`);
    window.history.pushState({}, null, newUrl);
}