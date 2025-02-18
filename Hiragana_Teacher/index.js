/* eslint-disable @typescript-eslint/no-unused-vars */
const pageURL = "./" // Use for redirecting backend usage.
let promptText = "";
let answerText = "";

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

    let newUrl = `${window.origin}/Hiragana_Teacher/?${queryString}`;
    console.log(`Changed page url to ${newUrl}!`);
    window.history.pushState({}, null, newUrl);
}

/**
 * @type {{Name: String, ObjectName: String, AnswerName: String, Author: Number, Visibility: public | private, Set: [{CharacterHere: String, chance: Number}]}}
 */
let list, 
listNumber, 
/**@type {{CharacterHere: string;chance: number;}} */
part, 
character, syllable, userIsMobile, currentPage = "", login_token = -1, Login_Username = "", SetInformation, exampleSetDisplay;
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

        // Make the buttons and inputs big so their fingers can get at them.
        const smallStuff = [ document.getElementById("Selection"), document.getElementById("SubmitButton"), document.getElementById("VocabButton"), document.getElementById("StartButton"), document.getElementById("BackButton"), document.getElementById("AnswerInput")]
        smallStuff.forEach(element => {
            element.style.fontSize = "150%"
            element.style.width = "100%"
        });

        const AnswerBox = document.getElementById("AnswerInput");
        AnswerBox.style.width = "97%"

        // Make the instructions change.
        document.getElementById("instructions").innerText = "Please use the dropdown below to select a set and then click the button to start."

        // Alter the Login Pane.
        const LoginItems = [ document.getElementById("Login").style, document.getElementById("NotLoggedInPane").style, document.getElementById("LoggedInPane") ];
        LoginItems.forEach(item => {
            item.display = "block";
            item.position = "relative";
            item.transform = "scale(0.9)"
        })
        

        // Hide the "Create a Set" button and search box.
        document.getElementById("CreateASetButton").style.visibility = "hidden";
        document.getElementById("Search").style.visibility = "hidden";
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

    // Make is to that the Search box works on enter too.
    let SearchBox = document.getElementById("SearchBox");
    SearchBox.addEventListener("keydown", (key) => {
        // Check if it's the enter key.
        if (key.key == "Enter")
            ScrollToSearch(document.getElementById('SearchBox').value)
    })

    // Make it so that the user's login token is invalidated when they leave the page.
    window.onbeforeunload = (event) => {
        postJSON(`${pageURL}/Post_Modules/InvalidateToken.js&cache=false`, { token: login_token });
    };

    // If there's a set specified in the URL, load it immediately.
    const params = parseQuery(location.href.substring(location.href.indexOf("?")));
    if (params.has("set")) {
        load(params.get("set"));
    }

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

let authorNameCache = { };
async function authorIDToName(id) {
    if (AuthorIsInCache(id))
        return authorNameCache[id];

    if (authorNameCache[id] == null) {
        await AddAuthorToCache(id);
    }
    return authorNameCache[id];
}

async function AddAuthorToCache(id) {
    authorNameCache[id] = (await fetchJSON(`${pageURL}/Modules/GetAuthorName.js&author=${id}`)).name
    console.log(`Added ${id} with name ${authorNameCache[id]} to cache!`)
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

let LastSetId = -1;
function load(setID, visible = true) {
    LastSetId = setID;
    // Put the setID in the URL. 
    UpdatePageParams({"set": setID})
    currentPage = "game"
    list = setID;

    // Erase change cache on reload.
    ChangeCache = [];
    gameEndedSinceLastLoop = true;

    // Now do the actual loading.
    LoadSetAndStart(visible);
}

let chances; const DEFAULT_CHANCE = 3;
let answerMode, kanjiMode, kanjiDisplayMode = 0;
async function LoadSetAndStart(visible = true) {
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
    
    // Start the loop that checks if there's data that needs to be sent and sends it, but only if we're logged on.
    if (login_token != -1) {
        gameEndedSinceLastLoop = false;
        SendChangesToTheServer();
    }

    // Set answer and kanji default mode.
    answerMode = "Normal";
    kanjiMode = undefined;
    if (list.Notes != undefined) {
        if (list.Notes.includes("AnswerMode")) {
            // Slice out what the answer mode is.
            answerMode = list.Notes.substring(list.Notes.indexOf("AnswerMode"));
            answerMode = answerMode.substring(answerMode.indexOf(":") + 1, answerMode.indexOf("\n")).trim();
        }

        if (list.Notes.includes("KanjiMode")) {
            kanjiMode = list.Notes.substring(list.Notes.indexOf("KanjiMode"));
            kanjiMode = kanjiMode.substring(kanjiMode.indexOf(":") + 1, kanjiMode.indexOf("\n")).trim();

            document.getElementById("KanjiModeButton").hidden = false;
        } else {
            document.getElementById("KanjiModeButton").hidden = true;
            kanjiMode = undefined;
        }
    }
    
    // Swap over to the game screen, also prepare prompt and answer texts.
        // Don't be visible if we're not visible.
    if (!visible) return;
    else {
        answerText = "{q} is {a}."; promptText = "What {c} is this?"
        document.getElementById("prompt").innerText = promptText.replace("{c}", list.ObjectName)
        answerText = answerText.replace("{at}", list.AnswerName);
        document.getElementById("AnswerInput").placeholder = list.AnswerName;
    
        // Prepare notes section and author name display.
        document.getElementById("AuthorNameDisplay").innerHTML = `Set by ${await authorIDToName(list.Author)}`;
    
        // Even though the server will also filter this out-- just in case, also filter out scripts here.
        const Notes = (list.Notes == undefined ? "" : list.Notes).replaceAll("<script", "<p").replaceAll("</script>", "</p>");
        document.getElementById("NotesDisplay").innerHTML = Notes;
    
        ToggleScreen()
    
        // Start the game!
        startGame();
    }
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

function SelectAndDisplayACharacter() {
    // Select a character.
    part = SelectCharacter();

    // Pull out the character and the answers.
    const keys = Object.keys(part);
    let characterIndex = 0;
    // Make sure that the zeroth index is the character!
    if (keys[1] != "chance") characterIndex = 1;

    character = keys[characterIndex], syllable = part[keys[characterIndex]];

    DisplayCharacter();
}

function DisplayCharacter() {
    // Use seperate lines on mobile but not on desktop.
    const seperator = userIsMobile ? "<br>" : "・"
    let QuestionText = character.replaceAll("・", seperator); // This is innefficient but it makes the code easier to read so whatever.

    // If there's a kanji mode, handle it appropriately.
    if (kanjiMode != undefined && QuestionText.includes(seperator)) {
        const before = kanjiMode.toLowerCase().includes("before");

        switch (kanjiDisplayMode) {
            case 1: // First mode, Kanji only.
                QuestionText = before ? QuestionText.substring(0, QuestionText.indexOf(seperator)) : QuestionText.substring(QuestionText.indexOf(seperator) + seperator.length);
                break;

            case 2: // Second mode, Kana only.
                QuestionText = before ? QuestionText.substring(QuestionText.indexOf(seperator) + seperator.length) : QuestionText.substring(0, QuestionText.indexOf(seperator));
                break;

            default: // Third mode, default.
                break;
        }
    }

    // Display the parts. (If the user's logged in, put a Jisho link instead.)
    if (login_token == -1)
        document.getElementById("Display").innerHTML = QuestionText;
    else {
        document.getElementById("Display").innerHTML = `<a href="https://jisho.org/search/${character}" style="text-decoration: none;">${QuestionText}</a>`;

        // Also load examples here if they're requested.
        LoadCurrentExample();
    }
}

function SwapKanjiMode() {
    kanjiDisplayMode = ++kanjiDisplayMode % 3;
    DisplayCharacter();
}

let ExampleCache = {};
function LoadCurrentExample() {
    const ExampleSentenceDisplay = document.getElementById("GameExampleDiv");
    if (ExamplesEnabled) {
        // Send the request to the server..
        const data = {
            "Set": listNumber,
            "Word": character,
            "Definition": syllable,
            "ForceNew": false,
            "login_token": login_token
        };
        if (ExampleCache[character] != null) {
            const json = {Example: ExampleCache[character]};
            ExampleSentenceDisplay.innerHTML = json.Example + `<br><a href="https://jisho.org/search/${json.Example}">Jisho Link</a>`;
            ExampleSentenceDisplay.hidden = false;
        } else {
            postJSON(`${pageURL}/Post_Modules/GetExampleSentence.js&cache=false`, data)
                .then(json => {
                    if (json.successful) {
                        // The below code is safe. All content is controlled.
                        ExampleSentenceDisplay.innerHTML = json.Example + `<br><a href="https://jisho.org/search/${json.Example}">Jisho Link</a>`;
                        ExampleSentenceDisplay.hidden = false;
                        ExampleCache[character] = json.Example;
                    } else {
                        ReLog().then(() => LoadCurrentExample())
                    }
                });
        }
    } else {
        ExampleSentenceDisplay.hidden = true;
    }
}

function SyllableToList(syllable) {
    let HRAnswer = syllable; // HR = Human readable
    if (syllable.indexOf("/") != -1) {
        HRAnswer = syllable.replaceAll("/", ", ");
        HRAnswer = HRAnswer.substring(0, HRAnswer.lastIndexOf(", ")) + " or " + HRAnswer.substring(HRAnswer.lastIndexOf(", ") + 1);
    }
    return HRAnswer;
}

function ArrayContains(array, item) {
    for (let i = 0; i < array.length; i++) if (array[i] == item) return true;
    return false;
}

function EvaluateAnswer() {
    let right = false;
    /**
     * @param {String} string 
     * @returns String processed.
     */
    function Process(string) {
        return string.trim().toLowerCase().replaceAll(".", "").replaceAll("!", "").replaceAll("?", "").replaceAll(",", "").replaceAll("-", "").replaceAll(" ", "");
    }
    let UserAnswer = document.getElementById("AnswerInput").value;

    if (answerMode == "Normal") {
        // Tell the user if their answer was right or wrong.
            // Ignore capitalization and punctuation.
        UserAnswer = Process(UserAnswer + "").split("/")
        
        // Check if the user's answer matches any of the supplied ones.
        let ActualAnswers = Process(syllable).split("/");
        ActualAnswers.forEach(ValidAnswer => {
            // Save performance by only checking if the answer is correct if a previous answer wasn't correct.
                // JS won't let me break from this loop, so this is how I'm doing it.
            if (right == false) {
                let answer = ValidAnswer.trim();
                if (UserAnswer == answer) {
                    right = true; 
                }
            }
        });
    } else if (answerMode == "NoSplit") {
        right = UserAnswer == syllable;
    } else if (answerMode == "Includes") {
        right = syllable.includes(UserAnswer);
    }

    // If the user was right, decrease the chance of getting that one.
        // Otherwise, increase the chance by two.
    if (right) {
        DecrementChance(1);
    } else {
        IncrementChance(2);
    }
    
    // Create a human-readable answer by replacing all the slashes with ","
        // And the last one with "or"
        // But only do this if the mode is normal.
    let HRAnswer;
    if (answerMode == "Normal") HRAnswer = SyllableToList(syllable);
    else HRAnswer = syllable;
    
    HRAnswer = answerText.replace("{a}", HRAnswer).replace("{q}", character).toString();

    // If the last two characters in HRAnswer are punctuation, remove the extra punctuation.
    if (ArrayContains(".?!".split(''), HRAnswer.charAt(HRAnswer.length - 1))) HRAnswer = HRAnswer.slice(0, -1);

    // The below has been altered to limit user input to text. Without real effort, this error will continue to exist.
    let text = `You were ${right ? "right" : "wrong"}!<br><p id="PHAnswer"></p>`;
    document.getElementById("PHAnswerShower").innerHTML = text;
    document.getElementById("PHAnswer").innerText = HRAnswer
    document.getElementById("AnswerInput").value = "";

    // Get another character.
    SelectAndDisplayACharacter();
}

// Chooses a character to test the user on.
let LastSelectedChoice = -1;
function SelectCharacter() {
    /* Procedure:
    If the set is longer than 20, divide it into (at most) 20-length chunks.
    Calculate the average score within each chunk. If it's more than the average of the full thing, study it.
    
    Once we've selected a chunk, flip a three-sided coin and if it's heads, choose the one with most times wrong. Otherwise, choose randomly.
    */

    // Divide into chunks.
    /**
     * @type {[[{CharacterHere: String, chance: Number}]]}
     */
    let chunks = [];
    for (let i = 0; i < list.Set.length; i++) {
        if (i % 20 == 0) {
            chunks[Math.floor(i / 20)] = [];
        }

        chunks[Math.floor(i / 20)].push(list.Set[i]);
    }

    // Calculate chunk averages.
    let averages = [];
    chunks.forEach(chunk => {
        let avg = 0;
        for (let i = 0; i < chunk.length; i++) {
            avg += chunk[i].chance;
        }
        avg /= chunk.length;
        averages.push(avg);
    })

    // Select the chunk with the highest average score.
    let max = Number.NEGATIVE_INFINITY;
    /**
     * @type [{CharacterHere: String, chance: Number}]
     */
    let selectedChunk = null;
    for (let i = 0; i < chunks.length; i++) {
        if (averages[i] > max) {
            selectedChunk = chunks[i];
            max = averages[i];
        }
    }

    // console.log(`Selected chunk: ${chunks.indexOf(selectedChunk)}`);

    // Gets a random index from the chunk.
    let RandomCharacter = () => { 
        return Math.floor(Math.random() * selectedChunk.length); 
    }

    // Selects the highest chance in the chunk.
    function GetMaxChanceIndex()
    {
        let maxIndex = -1, max = Number.NEGATIVE_INFINITY;
        for (let i = 0; i < selectedChunk.length; i++)
            if (selectedChunk[i].chance > max)
            {
                maxIndex = i; max = selectedChunk[i].chance;
            }

        return maxIndex;
    }

    // Flip a three-sided coin, and if it's heads, choose the one with the max number of times wrong. Else, choose a random one.
    let rand = Math.floor(Math.random() * 3);
    let DontChooseRandomly = (rand == 0);
    let choice = -1;

    if (DontChooseRandomly)
        choice = GetMaxChanceIndex();
    else
        choice = RandomCharacter();

    // Prevent the same one from being chosen twice in a row, but only if the set's long enough to let that happen.
        // NOTE: This wastes flops when the selected chunk changes, but it's transparent to the user and not really that big of a deal so I'm not going to fix it lol.
    if (choice == LastSelectedChoice && list.Set.length >= 2) 
        do 
            choice = RandomCharacter()
        while (choice == LastSelectedChoice)
    
    LastSelectedChoice = choice;
    return selectedChunk[choice];
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

/**
 * Posts the data to the given URL.
 * @param {String} URL The URL to post to.
 * @param {{*}} data The JSON for the server. DO NOT STRINGIFY BEFOREHAND!
 * @returns {Promise<{*}>} The JSON back from the server.
 */
async function postJSON(URL, data) {
    let request = fetch(URL, {
        method: "POST",
        body: JSON.stringify(data)
    })
        
    return request.then((res) => res.json());
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
        loginPane.innerText = loginPrompt.replace("{X}", Login_Username)
        UpdateVisibleSets();

        // Show the "Create a Set Button"
        document.getElementById("CreateASetButton").hidden = false;

        // Reload the set.
        if (LastSetId != -1) {
            load(LastSetId, false);
            
        }
    } else {
        loginPane.innerText = "Incorrect password!"
        setTimeout(() => {
            loginPane.style.display = "none";
            document.getElementById("NotLoggedInPane").style.display = "block"
        }, 500)
    }
}

async function UpdateVisibleSets() {
    await AddPublicSets();
    await AddPrivateSets();

    // Also show the cards buttons here.
    ShowCardsButtons();
    ShowEditableSets()
}

// Loops through all Flash Card buttons and shows them.
function ShowCardsButtons() {
    // If the user's logged in, show all the buttons. (If they're on mobile, show the button instead.)
    if (Login_Username != null && !userIsMobile) {
        SetInformation.forEach(element =>
            document.getElementById(`CardButton_${element.ID}`).hidden = false
        );
    } else if (Login_Username != null)
        document.getElementById("VocabButton").hidden = false;
}

// Makes a word into its plural version.
function Pluralify(word) {
    // Do some processing stuff to the ObjectName if it's referring to something using `'s`...
    if (word.endsWith("'s"))
        word = word.replace("'s", "");

    if (word.endsWith("i"))
        return word + "i";
    else return word + "s";
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
                        text += `<option value="${element.ID}">${element.Name.replace("<br>", " ")}</option>`
                        continue;
                    }

                    let authorName = await authorIDToName(element.author)

                    // Assemble the string around it.
                    all = all + exampleSetDisplay
                        .replace("Name", element.Name)
                        .replace("Length", element.length + " " + Pluralify(element.ObjectName))
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
                // Set up the desktop and mobile UI.
                let all, text = all = "";

                for (let i = 0; i < response.sets.length; i++) {
                    let element = response.sets[i];

                    // If the user's on a mobile device, only process the stuff for their dropdown.
                    if (userIsMobile) {
                        text += `<option value="${element.ID}">${element.Name.replace("<br>", " ")}</option>`
                        continue;
                    }

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
                        .replaceAll("{s}", `${element.ID}`)
                        .replace("Set_Example", `Set_${element.ID}`)
                        .replace("{a}", authorName);
                }

                document.getElementById("sets").innerHTML = all + document.getElementById("sets").innerHTML;
                document.getElementById("Selection").innerHTML = text + document.getElementById("Selection").innerHTML;
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

let LoginData = {}

// Relogs the user, using saved information.
async function ReLog() {
    if (Object.keys(LoginData).length > 1)
        return LoginAs(LoginData.username, LoginData.password, true);
    else return null;
}

async function LoginAs(username, password, forceResetToken = false) {
    return new Promise(async res => {
        // Get a login token from the server.
        LoginData = {
            "username": username,
            "password": password
        }

        let token = (await postJSON(`${pageURL}Post_Modules/GetLoginToken.js&cache=false`, LoginData)).token;
        
        // Check if the token was valid and take the correct actions if it was, tell the user they were wrong, otherwise.
        if (token != -1 || forceResetToken) {
            login_token = token;
            Login_Username = LoginData.username;
            updateLoginPane(true);

            // If the game is currently running, start sending data to the server.
            if (currentPage == "game") SendChangesToTheServer()

            // Show example sentence button here.
            document.getElementById("GameExampleSentenceButton").hidden = false;

            res(true)
        } else {
            document.getElementById("GameExampleSentenceButton").hidden = true;
            updateLoginPane(false);
            res(false)
        }
    })
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
        document.getElementById("SetMaker").style.display = "block";
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

    // Load the notes in.
    if (set.Notes != undefined)
        document.getElementById("NotesInput").value = set.Notes;
    else document.getElementById("NotesInput").value = "";

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

async function LoadCards(set) {
    // Save information about the set.
    currentPage = "cards";
    list = set;
    
    // Load the set.
    listNumber = list;
    list = await fetchJSON(`${pageURL}Sets/${list}.json`);

    // Convert that information into the form that the cards system expects.
    let ListOfWordsInNewFormat = []
    list.Set.forEach(set => {
        let setInOtherFormat = {
            front: Object.keys(set)[0],
        };

        // Turn the answer into a human-readable list, and use that for the rear.
        setInOtherFormat.back = SyllableToList(set[setInOtherFormat.front]);
        ListOfWordsInNewFormat.push(setInOtherFormat);
    })

    // Start the cardviewer.
    StartCards(ListOfWordsInNewFormat);
}

let IsCardPaneLoaded = false;
let listOfWords = [];
async function StartCards(list) {
    // Hide the other panes, Load the cards pane, if it's not already loaded.
    if (!IsCardPaneLoaded) {
        await loadToInnerHTML('./FlipCard.html', "CardPane");
        await loadScriptToChildOf("CardPane", "./FlipCard.js");
        IsCardPaneLoaded = true;
    }

    // Wait until the stuff is loaded...
    while (typeof move === 'undefined')
        await new Promise((res) => setTimeout(() => {res(console.log("Waiting!"))}, 30))

    listOfWords = list;
    index = 0;
    move(0);

    document.getElementById("ListSelection").hidden = true;
    document.getElementById("CardPane").hidden = false;
}

function leaveCardScreen() {
    document.getElementById("ListSelection").hidden = false;
    document.getElementById("CardPane").hidden = true;
}

// Search thing.
/**
 * Searches for something in the set list and then scrolls to it.
 * @param {String} query What to search for.
 */
async function ScrollToSearch(query) {
    // Look through all titles and scroll to the one which has the most word matches.
    let MaxWordMatches = 1, Element;
    // Split query into words.
    query = query.toLowerCase().trim().split(" ")

    // Use word matching if the query is only one word long.
    if (query.length == 1) 
        query[0] = `${query[0]} `

    const Children = document.getElementById("sets").children;

    for (let i = 0; i < Children.length; i++) {
        // Get the words. Add a space after if we're dealing with a single query.
        /**
         * @type {[String]}
         */
        let words = Children[i].innerText.toLowerCase();

        // See how many matches it has.
        let matches = 0; 
        
        // Check to see if the text of the thing contains any query words.
        for (let p = 0; p < query.length; p++) {
            let keyword = query[p];
            if (words.indexOf(keyword) != -1)
                {
                    matches++;
                    continue;
                }
        }

        if (matches >= MaxWordMatches) {
            MaxWordMatches = matches; 
            Element = Children[i];
        }
    }

    // Once we have the most-matching element, scroll to it.
    if (Element != undefined) {
        Element.scrollIntoView({ behavior: 'smooth' });

        // Highlight the text in the set.
        return new Promise(async (resolve) => {
            for (let i = 0; i < 4; i++) {
                let color = i % 2 == 0 ? "yellow" : "antiquewhite"
                Element.style = "background: " + color + ";"
                await new Promise(r => setTimeout(() => {
                    r()
                }, 1000))
            }

            Element.style = "";
        })
    }
    else
        alert("No results found!")
}

// Show example sentences on the game.
let ExamplesEnabled = false;
function ToggleGameExamples() {
    ExamplesEnabled = !ExamplesEnabled;
    document.getElementById("GameExampleDiv").hidden = ExamplesEnabled;

    const Button = document.getElementById("GameExampleSentenceButton");
    if (ExamplesEnabled) {
        Button.innerText = Button.innerText.replaceAll("Show", "Hide");
    } else {
        Button.innerText = Button.innerText.replaceAll("Hide", "Show");
    }

    // Request examples for the current thing.
    LoadCurrentExample();
}