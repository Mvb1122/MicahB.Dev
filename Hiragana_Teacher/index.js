const pageURL = "https://micahb.dev/Hiragana_Teacher/"
let promptText = "";
let answerText = "";

let list, listNumber, part, character, syllable, userIsMobile, currentPage = "", login_token = -1, Login_Username = "", SetInformation, exampleSetDisplay;
async function loadAdditional() {
    console.log("Starting initial load!");
    // Determine if the user is using a mobile device.
    if (userIsMobile = window.mobileCheck()) {
        console.log("The user is on mobile!");
        // Hide the actual set selection from them and show the mobile one.
        const desktopSelection = document.getElementById("sets").style;
        desktopSelection.visibility = "hidden";
        desktopSelection.height = "0px";
        const mobileSelection = document.getElementById("MobileSelection").style;
        mobileSelection.visibility = "visible";
        mobileSelection.height = "100%";

        // Make the buttons and inputs big so their fingies can get at them.
        const smallStuff = [ document.getElementById("Selection"), document.getElementById("SubmitButton"), document.getElementById("StartButton"), document.getElementById("BackButton"), document.getElementById("AnswerInput")]
        smallStuff.forEach(element => {
            element.style.fontSize = "150%"
            element.style.width = "100%"
        });

        const AnswerBox = document.getElementById("AnswerInput");
        AnswerBox.style.width = "97%"

        // Make the instructions change.
        document.getElementById("instructions").innerText = "Please use the dropdown below to select a set and then click the button to start."

        // Hide the Login pane.
        const loginPane = document.getElementById("Login").style;
        loginPane.display = "none"
        loginPane.height = "0px";

        // Hide the "Create a Set" button
        document.getElementById("CreateASetButton").style.visibility = "hidden";
    }

    currentPage = "ListSelection";
    
    // Get list of character sets from the server and offer it to the user.
    AddPublicSets();
    exampleSetDisplay = document.getElementById("Set_Example").outerHTML.replace("hidden", "").toString();
    

    // Make it so that, when the user presses enter on the text box, it goes onto the next question.
    let inputBox = document.getElementById("AnswerInput");
    inputBox.addEventListener("keydown", (key) => {
        // Check if it's the enter key.
        if (key.key == "Enter")
            EvaluateAnswer();
    })

    // Make it so that the user's login token is invalidated when they leave the page.
    window.onbeforeunload = (event) => {
        postJSON(`${pageURL}/Post_Modules/InvalidateToken.js&cache=false`, { token: login_token });
    };

    return true;
}

async function GoToSignUp() {
    // Dynamically load in the sign up information.
    await loadToInnerHTML('./SignUp.html', "SignUpPane");
    await loadScriptToChildOf(`SignUpPane`, `./SignUp.js`);

    // Move the user to the Sign up screen.
    document.getElementById("SignUpPane").style.display = "block"
    document.getElementById("ListSelection").style.display = "none"
    document.getElementById("game").style.display = "none"

    // Hide the existing login pane. 
    document.getElementById("Login").style.display = "none";
}

let authorNameCache = { test: null };
async function authorIDToName(id) {
    if (AuthorIsInCache(id))
        return authorNameCache[id];

    if (authorNameCache[id] == null) {
        await AddAuthorToCache(id);
    }
    return authorNameCache[id];
}

async function AddAuthorToCache(id) {
    console.log(`Adding ${id} to cache!`)
    authorNameCache[id] = (await fetchJSON(`${pageURL}/Modules/GetAuthorName.js&author=${id}`)).name
    console.log(`${id} is ${authorNameCache[id]}!`)
    return authorNameCache[id];
}

function AuthorIsInCache(id) {
    let cache = Object.keys(authorNameCache);
    for (let author in cache) {
        if (cache[author] == id)
            return true;
    }

    return false;
}

function LeaveSignUp() {
    document.getElementById("SignUpPane").style.display = "none";
    document.getElementById("ListSelection").style.removeProperty("display");
    document.getElementById("game").style.removeProperty("display");
    document.getElementById("Login").style.display = "block";
}

async function loadScriptToChildOf(parent, url) {
    let script = document.createElement("script");
    script.src = url;
    document.getElementById(parent).appendChild(script);
}

async function loadToInnerHTML(url, elementId) {
    // Fetch the HTML from the server.
    return fetch(url)
        .then(response => response.text())
        .then(response => document.getElementById(elementId).innerHTML = response);
}

function load(setID) {
    currentPage = "game"
    list = setID;
    LoadSetAndStart();
}

let chances; const DEFAULT_CHANCE = 3;
async function LoadSetAndStart() {
    // Get the list from the server.
    listNumber = list;
    list = await fetchJSON(`${pageURL}Sets/${list}.json`)
    console.log("Fetched set from server! See below:")
    console.log(list);

    // Create the chances list.
        // Download saved progress from the server.
    let existing_data = {};
    if (login_token != -1) {
        existing_data = (await postJSON(`${pageURL}/Post_Modules/GetProgress.js&cache=false`, {
            "login_token": login_token,
            "set": listNumber
        })).Chances
    }

        // Create filler data.
    for (let i = 0; i < list.Set.length; i++) {
        list.Set[i].chance = DEFAULT_CHANCE;
    }
        // Overwrite the filler data with what progress there is.
    for (let characterData in existing_data) {
        characterData = existing_data[characterData]
        for (let i = 0; i < list.Set.length; i++) {
            let listParts = Object.keys(list.Set[i])
            if (listParts[0] == characterData.Character)
                list.Set[i].chance = characterData.Chance
        }
    }

    console.log("Final composited set:")
    console.log(list.Set)
        
    // Swap over to the game screen, also prepare prompt and answer texts.
    answerText = "{q} is {a}."; promptText = "What {c} is this?"
    document.getElementById("prompt").innerText = promptText.replace("{c}", list.ObjectName)
    answerText = answerText.replace("{at}", list.AnswerName);
    document.getElementById("AnswerInput").placeholder = list.AnswerName;
    ToggleScreen()

    // Start the game!
    startGame();

    // Start the loop that checks if there's data that needs to be sent and sends it, but only if we're logged on.
    if (login_token != -1)
        SendChangesToTheServer();
}

let ChangeCache = [], gameEndedSinceLastLoop;
async function SendChangesToTheServer() {
    // Push data to the server once every two seconds.
    setTimeout(() => {
        // Only push data if there's data to be pushed.
            if (ChangeCache.length > 0) {
                // Reforge the ChangeCache into the form that we need to send to the server.
            let t1 = [];
            ChangeCache.forEach(change => {
                let keys = Object.keys(change);
                t1.push({
                    "Character": keys[0],
                    "Chance": change.chance
                });
            });

            let changes = {
                "login_token": login_token,
                "set": listNumber,
                "changes": t1
            }

            // Send the data to the server.
            postJSON(`${pageURL}/Post_Modules/UpdateProgress.js&cache=false`, changes);
            ChangeCache = [];
        }
        
        // Stop the loop if the game has ended.
        if (!gameEndedSinceLastLoop)
            SendChangesToTheServer();
    }, 2000)
}

// Start up the game loop by selecting a character to use. 
async function startGame() {
    // Wipe the PHAnswerShower.
    document.getElementById("PHAnswerShower").innerHTML = "";

    // Select and display a character.
    SelectAndDisplayACharacter();
}

function GetChance() {
    return part.chance;
}

function DecrementChance(ammount) {
    part.chance -= ammount;
    ChangeCache.push(part);
}

function IncrementChance(ammount) { return DecrementChance(-ammount); }

function GetMaxChanceIndex()
{
    // Find the maximum chance of all the characters.
    let maxIndex = -1, max = -1000;
    for (let i = 0; i < list.Set.length; i++)
        if (list.Set[i].chance > max)
        {
            maxIndex = i; max = list.Set[i].chance;
        }

    return maxIndex;
}

function SelectAndDisplayACharacter() {
    // Select a character.
    part = SelectCharacter();

    // Abstract its parts.
    let parts = JSON.stringify(part).split('"');
    character = parts[1], syllable = parts[3];

    // Display the parts.
    document.getElementById("Display").innerText = character;
}

function EvaluateAnswer() {
    // Tell the user if their answer was right or wrong.
    let UserAnswer = (document.getElementById("AnswerInput").value + "").trim().toLowerCase();
    
    // Check if the user's answer matches any of the supplied ones.
    let right = false;
    let answers = syllable.trim().toLowerCase().split("/");
    answers.forEach(a => {
        // Save performance by only checking if the answer is correct if a previous answer wasn't correct.
            // JS won't let me break from this loop, so this is how I'm doing it.
        if (right == false) {
            let answer = a.trim();
            if (UserAnswer == answer) {
                right = true; 
            }
        }
    });

    // If the user was right, decrease the chance of getting that one.
        // Otherwise, increase the chance by two.
    if (right) {
        DecrementChance(1);
    } else {
        IncrementChance(2);
    }
    
    // Create a human-readable answer by replacing all the slashes with ","
        // And the last one with "or"
        // But only do this if there's more than one answer...
    let HRAnswer = syllable;
    if (syllable.indexOf("/") != -1) {
        HRAnswer = syllable.replaceAll("/", ", ");
        HRAnswer = HRAnswer.substring(0, HRAnswer.lastIndexOf(", ")) + " or " + HRAnswer.substring(HRAnswer.lastIndexOf(", ") + 1);
    }

    let text = `You were ${right ? "right" : "wrong"}!<br>${answerText.replace("{a}", HRAnswer).replace("{q}", character)}`;
    document.getElementById("PHAnswerShower").innerHTML = text;
    document.getElementById("AnswerInput").value = "";

    // Get another character.
    SelectAndDisplayACharacter();
}

// Chooses a character to test the user on.
function SelectCharacter() {
    // Flip a coin, and if it's heads, choose the one with the max number of times wrong. Else, choose a random one.
    let random = { 
        Next(int) {
            return Math.floor(Math.random() * int)
        }
    }
    let rand = random.Next(3);
    let choice = (rand == 0);

    if (choice) {
        let choice = GetMaxChanceIndex();
        return list.Set[choice];
    } else
        return list.Set[Math.floor(Math.random() * list.Set.length)];
}

function ToggleScreen() {
    let ListSelection, game;

    // Ascertain whether we're ending the game or not, and feed that into the loop that sends info to the server.
        // (Basically, just stop the loop if we're leaving, since it saves resources.)
    let leavingGame = !document.getElementById("game").hidden;
    gameEndedSinceLastLoop = leavingGame;

    (ListSelection = document.getElementById("ListSelection")).hidden = !document.getElementById("ListSelection").hidden;
    ListSelection.style.removeProperty("display");
    (game = document.getElementById("game")).hidden = leavingGame;
    game.style.removeProperty("display");
}


async function fetchJSON(URL) {
    return fetch(URL).then((r) => (r.json()));
}

async function postJSON(URL, data) {
    return fetch(URL, {
        method: "POST",
        body: JSON.stringify(data)
    })
        .then((res) => res.json());
}

const loginPrompt = "Logged in as {X}!"
async function updateLoginPane(IsPasswordCorrect) {
    // Make sure that the login pane is visible, but hide the normal login display and show the "Logged in as {X}!" one.
    console.log("Login token: " + login_token);
    document.getElementById("Login").style.display = "block";
    document.getElementById("NotLoggedInPane").style.display = "none"
    let loginPane; 
    (loginPane = document.getElementById("LoggedInPane")).style.display = "block";

    if (IsPasswordCorrect) {
        // Update the username and set displays if the password was right.
        loginPane.innerHTML = loginPrompt.replace("{X}", Login_Username)
        UpdateVisibleSets();

        // Show the "Create a Set Button"
        document.getElementById("CreateASetButton").hidden = false;
    } else {
        loginPane.innerHTML = "Incorrect password!"
        setTimeout(() => {
            loginPane.style.display = "none";
            document.getElementById("NotLoggedInPane").style.display = "block"
        }, 500)
    }
}

async function UpdateVisibleSets() {
    await AddPublicSets();
    await AddPrivateSets();
    ShowEditableSets()
}

async function AddPublicSets() {
    return new Promise((res) => {
        fetchJSON(pageURL + "Modules/GetCharacterSets.js&cache=false")
            .then(async (response) => {
                SetInformation = response.lists;
                
                // Set up the desktop and mobile UI.
                let all, text = all = "";

                for (let i = 0; i < response.lists.length; i++) {
                    let element = response.lists[i];

                    // If the user's on a mobile device, only process the stuff for their dropdown.
                    if (userIsMobile) {
                        text += `<option value="${element.ID}">${element.Name}</option>`
                        continue;
                    }

                    let authorName = await authorIDToName(element.author)

                    // Do some processing stuff to the ObjectName if it's referring to something using `'s`...
                    if (element.ObjectName.includes("'s"))
                        element.ObjectName = element.ObjectName.replace("'s", "");

                    // Assemble the string around it.
                    all = all + exampleSetDisplay
                        .replace("Name", element.Name)
                        .replace("Length", element.length + " " + element.ObjectName + "s")
                        .replaceAll("{s}", element.ID)
                        .replace("Set_Example", `Set_${element.ID}`)
                        .replace("{a}", authorName);
                }

                document.getElementById("Selection").innerHTML = text;
                document.getElementById("sets").innerHTML = all;
                if (!userIsMobile) document.getElementById("sets").style.visibility = "visible";
                else document.getElementById("MobileSelection").style.visibility = "visible";
                res(true);
            })
    })
}

async function AddPrivateSets() {
    return new Promise((res) => {
        // Get list of character sets from the server and offer it to the user, but only in the desktop sort of way.
        postJSON(pageURL + "Post_Modules/GetPrivateSets.js&cache=false", { token: login_token })
            .then(async (response) => {
                // Set up the desktop UI.
                let all = "";

                for (let i = 0; i < response.sets.length; i++) {
                    let element = response.sets[i];

                    // Append this response to the SetInformation.
                    SetInformation.push(element);

                    let authorName = await authorIDToName(element.author)

                    // Do some processing stuff to the ObjectName if it's referring to something using `'s`...
                    if (element.ObjectName.includes("'s"))
                        element.ObjectName = element.ObjectName.replace("'s", "");

                    // Assemble the string around it.
                    all = all + exampleSetDisplay
                        .replace("Name", element.Name)
                        .replace("Length", element.length + " " + element.ObjectName + "s")
                        .replaceAll("{s}", element.ID)
                        .replace("Set_Example", `Set_${element.ID}`)
                        .replace("{a}", authorName);
                }

                document.getElementById("sets").innerHTML = all + document.getElementById("sets").innerHTML;
                if (!userIsMobile) document.getElementById("sets").style.visibility = "visible";
                else document.getElementById("MobileSelection").style.visibility = "visible";
                res(true);
            })
        })
}

function ShowEditableSets() {
    // Using saved set information, decide which sets should be shown.
    SetInformation.forEach(element => {
        if (Login_Username != null) {
            let authorName = document.getElementById(`Author_${element.ID}`).innerHTML;
            authorName = authorName.substring(authorName.indexOf(":") + 1).trim();
            if (authorName == Login_Username) {
                document.getElementById(`EditButton_${element.ID}`).hidden = false;
            }
        } else document.getElementById(`EditButton_${element.ID}`).hidden = true;
    });
}

async function LoginAs(username, password) {
    // Get a login token from the server.
    let data = {
        "username": username,
        "password": password
    }
    let token = (await postJSON(`${pageURL}Post_Modules/GetLoginToken.js&cache=false`, data)).token;
    
    // Check if the token was valid and take the correct actions if it was, tell the user they were wrong, otherwise.
    if (token != -1) {
        login_token = token;
        Login_Username = data.username;
        updateLoginPane(true);
    } else {
        updateLoginPane(false);
    }
}

async function ToggleSetDisplay() {
    return new Promise(async (res) => {
        // If the set display is empty, download the content that should be in there and load it. 
        let SetCreationPaneLoaded = !document.getElementById("SetCreationPane").innerHTML.length == 0
        if (!SetCreationPaneLoaded) {
            loadToInnerHTML("./CreateSet.html", "SetCreationPane")
                .then(() => loadScriptToChildOf("SetCreationPane", "./CreateSet.js"))
                .then(() => res(true));
        }

        // Toggle the set display.
        document.getElementById("Home").hidden = !document.getElementById("Home").hidden;
        document.getElementById("SetCreationPane").hidden = !document.getElementById("SetCreationPane").hidden;

        while (document.getElementById("CreateSetButton") == null)
            await new Promise((r2) => setTimeout(() => {r2()}, 30))

        SetCreationMode = "Create";
        document.getElementById("CreateSetButton").innerText = "Submit!";
        if (SetCreationPaneLoaded) res(true)
    })
}

async function edit(set_id) {
    // Go to the set display.
    await ToggleSetDisplay();

    // Wait until the stuff is loaded...
    while (typeof Add_Line_With_Values === 'undefined')
        await new Promise((res) => setTimeout(() => {res()}, 30))

    // Download set information from the server.
    let set = await fetchJSON(`${pageURL}Sets/${set_id}.json`);
    document.getElementById("SetName").value = set.Name;
    document.getElementById("ObjectName").value = set.ObjectName;
    document.getElementById("AnswerName").value = set.AnswerName;

    // Make the visibility drop down select the right option.
    let VisibilitySelector;
    (VisibilitySelector = document.getElementById("PublicPrivateSelector")).value = set.Visibility;
    for (var i = 0; i < VisibilitySelector.options.length; i++) {
        if (VisibilitySelector.options[i].text === set.Visibility) {
            VisibilitySelector.selectedIndex = i;
            break;
        }
    }

    // Clear the rows and then put in the new ones.
    ClearRows();
    set.Set.forEach(AnswerPair => {
        let question = Object.keys(AnswerPair)[0];
        Add_Line_With_Values(question, AnswerPair[question]);
    })

    // Remove the first row, since it contains the default value.
        // This is a hacky solution... but it works.
    let FirstRowNum = Object.keys(rows)[0];
    FirstRowNum = FirstRowNum.substring(FirstRowNum.indexOf('_') + 1);
    document.getElementById(`remove_${FirstRowNum}`).onclick();
    
    // Set the creation mode to Edit, so it will edit sets rather than just make a new one. 
    SetCreationMode = "Edit";
    document.getElementById("CreateSetButton").innerHTML = "Submit Edits!";
    EditSetID = set_id;
    document.getElementById("DeleteSetButton").hidden = false;
}