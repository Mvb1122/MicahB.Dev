// let listOfWords = []
let index = 0;
let back = () => move(-1);
let foward = () => move(1);

function move(dist) {
    // Move the index back by one, loop it to the start if it passes by the end or to the end from the beginning.
    index = (index + dist) % listOfWords.length;
    if (index < 0) index = listOfWords.length - 1;
    
    document.getElementById("card_front").innerHTML = listOfWords[index].front;
    document.getElementById("card_back").innerHTML = listOfWords[index].back;

    // Whenever we move, make sure that the user has the right example sentence display, I guess.
    if (login_token != -1) {
        document.getElementById("MustSignInToGetExampleSentence").hidden = true;
        document.getElementById("GetExampleSentenceButton").hidden = false;
        document.getElementById("ExampleSentence").hidden = true;
        document.getElementById("ForceExampleSentenceButton").hidden = true;
    }
}

// Let arrow keys control moving forward and back.
document.addEventListener("keydown", (key) => {
    if (key.code == "ArrowRight" || key.code == "KeyD") // Right arrow or D key.
        move(1)
    else if (key.code == "ArrowLeft" || key.code == "KeyA") // Left arrow or A key.
        move(-1);
})


let startingText, startingStyle;
window.addEventListener('beforeprint', () => {
    // Prepare screen for printing.
    startingText = document.getElementById("body").innerHTML;
    startingStyle = document.getElementById("body").style;
    let FlipCardCSS = document.getElementById("Flip_Card_CSS").innerHTML;
    let base = document.getElementById("MultiCardDisplay").innerHTML;

    // Clear the screen.
    document.getElementById("body").innerHTML = ""; // document.getElementById("MultiCardDisplay").innerHTML;
    document.getElementById("body").style.backgroundColor = "white";
    document.getElementById("body").style.display = "grid";
    document.getElementById("body").style.gridTemplateColumns = "repeat(auto-fill, 186px)";
    document.getElementById("body").style.alignItems = "start"

    // Reapply the CSS.
    let css = document.createElement("style");
    css.innerHTML = FlipCardCSS;
    document.getElementById("body").appendChild(css);

    // Add the actual cards.
    listOfWords.forEach(word => {
        let WordCard = base.replace("FrontText", word.front.trim()).replace("BackText", word.back.trim());
        document.getElementById("body").innerHTML += WordCard;
    });
})

window.addEventListener('afterprint', () => {
    // Return things to normal.
    document.getElementById("body").innerHTML = startingText;
    document.getElementById("body").style = startingStyle;
})

function Print() {
    alert("Make sure to set your page margins to none! You can also set the page scale to 80% to fit 25 cards on one sheet, as well.") 
    window.print();
}

let CurrentFont = 0;
const fonts = ['Arial', 'Klee One']
function SetFontIndex(i) {
    const Font = fonts[i];
    // Put it on the card fronts and backs for non-printed versions. 
    ["card_front", "card_back"].forEach(id => document.getElementById(id).style.fontFamily = Font);
}

function MoveToNextFont() {
    CurrentFont++;
    return SetFontIndex((CurrentFont) % 2);
}

let IdleModeOn = false;
function ToggleIdleMode() {
    IdleModeOn = !IdleModeOn;

    // Set the text of the idle button based off of whether or not it's enabled.
    document.getElementById("ToggleIdleFlipButton").innerText = "Enable Idle Mode (Flips every Five seconds)".replace("Enable", IdleModeOn ? "Disable" : "Enable");

    FlipLoop();
}

async function FlipLoop() {
    if (IdleModeOn) {
        // Wait for five seconds, "flip" the card by swapping front/back contents.
        await (new Promise(resolve => setTimeout(resolve, 5000)));
        document.getElementById("card_front").innerText = document.getElementById("card_back").innerText;
        if (!IdleModeOn) return;

        // Wait for another five seconds, go to the next card.
        await (new Promise(resolve => setTimeout(resolve, 5000)));
        foward();
        if (!IdleModeOn) return;

        // Loop.
        FlipLoop();
    } else {
        // When leaving idle mode, return card to normal.
        move(0);
    }
}

async function GetExampleSentence(ForceNew = false) {
    const currentWord = listOfWords[index].front;

    // Send the request to the server..
    const data = {
        "Set": listNumber,
        "Word": currentWord,
        "Definition": listOfWords[index].back,
        "ForceNew": ForceNew,
        "login_token": login_token
    }
    postJSON(`${pageURL}/Post_Modules/GetExampleSentence.js&cache=false`, data)
        .then(e => {
            // Hide the button.
            document.getElementById("GetExampleSentenceButton").hidden = true;
            const ExampleSentenceDisplay = document.getElementById("ExampleSentence");

            // The below code is safe. All content is controlled.
            ExampleSentenceDisplay.innerHTML = e.Example + `<br><a href="https://jisho.org/search/${e.Example}">Jisho Link</a>`;
            ExampleSentenceDisplay.hidden = false;

            // Show force button.
            document.getElementById("ForceExampleSentenceButton").hidden = false;
        })
}