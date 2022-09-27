const pageURL = "https://micahb.dev/Hiragana_Teacher/"
let promptText = "";
let answerText = "";

let list, part, character, syllable, userIsMobile;
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
    }


    
    // Get list of character sets from the server and offer it to the user.
    fetchJSON(pageURL + "Modules/GetCharacterSets.js&cache=false")
        .then((response) => {
            let example = document.getElementById("Set_Example").outerHTML.replace("hidden", "").toString();
            
            // Simultaineously set up the desktop and mobile UI.
                // TODO: make it so it only does one :/
            let all, text = all = "";
            response.lists.forEach((element) => {
                text += `<option value="${element.ID}">${element.Name}</option>`

                // Do some processing stuff to the ObjectName if it's referring to something using `'s`...
                if (element.ObjectName.includes("'s"))
                    element.ObjectName = element.ObjectName.replace("'s", "");

                // Assemble the string around it.
                all = all + example.replace("Name", element.Name).replace("Length", element.length + " " + element.ObjectName + "s")
                    .replace("{s}", element.ID);
            });
            
            document.getElementById("Selection").innerHTML = text;
            document.getElementById("sets").innerHTML = all;
            if (!userIsMobile) document.getElementById("sets").style.visibility = "visible";
            else document.getElementById("MobileSelection").style.visibility = "visible";
        })

    // Make it so that, when the user presses enter on the text box, it goes onto the next question.
    let inputBox = document.getElementById("AnswerInput");
    inputBox.addEventListener("keydown", (key) => {
        // Check if it's the enter key.
        if (key.key == "Enter")
            EvaluateAnswer();
    })

    return true;
}

let chances; const DEFAULT_CHANCE = 3;

function load(setID) {
    list = setID;
    LoadSetAndStart();
}

async function LoadSetAndStart() {
    // Get the list from the server.
    list = await fetchJSON(`${pageURL}Sets/${list}.json`)
    console.log("Fetched set from server! See below:")
    console.log(list);

    // Create the chances list.
        // TODO: Pull down the user's saved chances from the server and use those if they exist.
    for (let i = 0; i < list.Set.length; i++) {
        list.Set[i].chance = DEFAULT_CHANCE;
    }
        
    // Swap over to the game screen, also prepare prompt and answer texts.
    answerText = "The {at} was {a}"; promptText = "What is this {c}?"
    document.getElementById("prompt").innerText = promptText.replace("{c}", list.ObjectName)
    answerText = answerText.replace("{at}", list.ObjectName)
    ToggleScreen()

    // Start the game!
    startGame();
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
}

function IncrementChance(ammount) {
    return DecrementChance(-ammount);
}

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

    let text = `You were ${right ? "right" : "wrong"}!<br>${answerText.replace("{a}", HRAnswer)}`;
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
    document.getElementById("ListSelection").hidden = !document.getElementById("ListSelection").hidden;
    document.getElementById("game").hidden = !document.getElementById("game").hidden
}

async function fetchJSON(URL) {
    return fetch(URL).then((r) => (r.json()));
}