/** @type {String} */
let username, 
/** @type {Number} */
pseudopassword; // Not an actual password!
function StageOne() {
    // First, hide the starting panel and go to the signup panel.
    document.getElementById("Base").hidden = true;
    document.getElementById("SignUp").hidden = false;

    // Generate a password. (Use half-decent randomness.)
    const array = new Uint32Array(1);
    self.crypto.getRandomValues(array);
    pseudopassword = array[0];
    document.getElementById("Password").innerText = pseudopassword;
}

function Wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, 1000))
}

async function PostToModule(Module, data) {
    const url = `./Post_Modules/${Module}`; 

    return (await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: data,
    })).json();
}

async function EnsureSignedUpAndShowGameOne() {
    // First, check that there's a username in the box.
    username = document.getElementById("UserName").value;
    if (username.trim() == "")
        return alert("Please enter a username in the box.");
    else {
        // Display loading stuff.
        document.getElementById("SignUp").hidden = true;
        document.getElementById("Loading").hidden = false;

        // Sign up.
        const data = JSON.stringify({
            username: username,
            pseudopassword: pseudopassword
        });
        const response = await PostToModule("SethSignup.js", data)

        if (response.sucessful == false) {
            alert("That user already exists! Please come up with a more original usename and try again.");
            return DoStage(0);
        }

        // Show first game.
        document.getElementById("Loading").hidden = true;
        document.getElementById("GameOne").hidden = false;
        SetGameOneText();
    }
}

const colors = "Red,Orange,Yellow,Green,Blue,Pink".split(",");
let lastColor = ""
function GetRandomColor() {
    // Select a different color from the last one chosen.
    let color = ""
    do {
        color = colors[Math.floor(Math.random() * colors.length)]
    } while (color == lastColor)
    lastColor = color;
    return color;
};
function SetGameOneText() {
    // Get colors.
    const TextColor = GetRandomColor()
    const TextText = GetRandomColor();

    // Set text.
    const text = document.getElementById("GameOneText")
    text.innerText = TextText;
    text.style = "color: " + TextColor;

    return TextColor;
}

let GameOneCurrentTextColor = "", GameOneCurrentRoundNumber;
let GameOneNumCorrect = 0, 
/** @type {Promise} */
GameOneCurrentRound;
async function StartGameOne() {
    // First, show the countdown.
    document.getElementById("GameOneDescription").hidden = true;
    document.getElementById("GameOneCountDown").hidden = false;
    document.getElementById("GameOneEndSceen").hidden = true;

    for (let i = 3; i >= 0; i--) {
        await new Promise((r) => {
            document.getElementById("GameOneCountDown").innerHTML = i == 0 ? "<b>Gooo!!!</b>" : i;
            setTimeout(() => {
                r();
            }, 1000);
        })
    }

    // After the countdown, go to the game.
    document.getElementById("GameOneCountDown").hidden = true;
    document.getElementById("GameOneGame").hidden = false;

    // Now that we're in the game, setup the record loop.
    for (let i = 0; i < 11; i++) {
        GameOneCurrentTextColor = SetGameOneText();
        GameOneCurrentRoundNumber = i;
        GameOneCurrentRound = new Promise((r) => {
            // After the practice round, start changing the text.
            if (i >= 1) {
                document.getElementById("GameOneRoundNumber").innerHTML = "Round <b>" + (i - 1) + "</b> Number correct: <b>" + GameOneNumCorrect + "</b>";
            } else {
                document.getElementById("GameOneRoundNumber").innerHTML = "Practice Round";
            }
            
            // Wait for 2.25 seconds.
            setTimeout(() => {
                // After the 2.25 seconds, move on. 
                    // If they haven't answered, mark them as wrong.
                if (GameOneCurrentRoundNumber == i)
                    EndGameOneRoundWithColor("");

                // Resolve to move onto the next round.
                r();    
            }, 2250);
        });
        await GameOneCurrentRound;
    }

    // Now that we have the data, submit it.
    PostToModule("SethPostGame.js", JSON.stringify({
        username: username,
        pseudopassword: pseudopassword,
        round: {
            game: 1,
            stats: GameOneNumCorrect.toString()
        }
    }))

    // Update the text on the GameOneEndScreen
    let Compliment = ""
    switch (GameOneNumCorrect) {
        case GameOneNumCorrect < 3: 
            Compliment = "Nice try!"
            break;
        
        case GameOneNumCorrect < 5:
            Compliment = "Good Job!";
            break;
        
        case GameOneNumCorrect < 9:
            Compliment = "So close!"
        
        default:
            Compliment = "Perfect!"
    }

    document.getElementById("GameOneEndScreenTextStart").innerHTML = `${Compliment} You got <b>${GameOneNumCorrect}</b> right out of ten!`;

    // Now, go to the Game One End screen.
    document.getElementById("GameOneGame").hidden = true;
    document.getElementById("GameOneEndSceen").hidden = false;

    // Clean up so that they can replay it if they want.
    GameOneCurrentRoundNumber = GameOneNumCorrect = 0;
}

function EndGameOneRoundWithColor(color) {
    const text = document.getElementById("GameOneText");
    text.style = "";

    // Check that the answer is correct and use the text containing correct/incorrect to see if it should be counted.
    const IsDisplayingCorrectText = document.getElementById("GameOneText").innerText.includes("orrect");
    if (GameOneCurrentTextColor.trim().toLowerCase() == color.trim().toLowerCase() && !IsDisplayingCorrectText) {
        // Ignore the practice round.
        if (GameOneCurrentRoundNumber != 0)
            GameOneNumCorrect++;

        text.innerText = "Correct!";
        GameOneCurrentRoundNumber++; 
    } else if (!IsDisplayingCorrectText) {
        text.innerText = "Incorrect :("
        GameOneCurrentRoundNumber++; 
    }
}

async function ShowGameTwoHideGameOne() {
    document.getElementById("GameTwo").hidden = false;
    document.getElementById("GameOne").hidden = true;
}

// Function reassigned later on.
let GameTwoReportMisclick = () => {

}

async function StartGameTwo() {
    // Show the div on screen and hide the intro and postgame divs.
    document.getElementById("GameTwoGame").hidden = false;
    document.getElementById("GameTwoDescription").hidden = true;
    document.getElementById("GameTwoEndScreen").hidden = true;

    // Setup the misclick thing.
    let lives = 3;
    GameTwoReportMisclick = () => {
        lives--;

        SetGameTwoLives(lives);
    }

    // At the start, set the lives to 3.
    SetGameTwoLives(3);

    async function GameTwoRound(RoundNum) {
        return new Promise(async (EndRound) => {
            // Calculate Grid size.
            const GridSize = Math.floor(RoundNum / 3) + 3;

            // First setup the grid.
            await MakeGameTwoGrid(GridSize, RoundNum + 2);

            // Make the text.
            document.getElementById("GameTwoText").innerHTML = `<b>Round:</b> ${RoundNum}, <b>Grid Size:</b> ${GridSize}`; 

            // After 1 second, clear the board and await inputs.
            ClickedBoxes = [];
            await new Promise((r) => setTimeout(r, 1000))
            for (let i = 0; i < GameTwoBoxes.length; i++) {
                const row = GameTwoBoxes[i]
                ClickedBoxes[i] = [];
                for (let j = 0; j < GameTwoBoxes[i].length; j++)
                {
                    const box = row[j];
                    ClickedBoxes[i][j] = false;
                    box.style.backgroundColor = "black"
                    box.clickable = true;
                }
            }

            // Now, let them click, I guess. (Check every 100ms to see if they've got it right.)
            do {
                await Wait(100);

                // Check to see if the clicked boxes match the unclicked ones.
                let AllCorrect = true;
                for (let i = 0; i < GridSize; i++) for (let j = 0; j < GridSize; j++)
                    if (ClickedBoxes[i][j] != (GameTwoBoxes[i][j].correct == true)) {
                        AllCorrect = false;
                    }
                
                if (AllCorrect) {
                    // Set the text to tell them that they got it.
                    document.getElementById("GameTwoText").innerHTML = "<b>Good job! You got them all right. Moving on.</b>"

                    // After one second, move on.
                    setTimeout(() => {
                        EndRound(true);
                    }, 1000);

                    // Also stop the loop.
                    break;
                }
            } while (lives > 0)

            if (lives == 0)
                // Getting here means that the player died.
                EndRound(false);
        })
    }

    let RoundNum = 1;
    do {
        if (await GameTwoRound(RoundNum)) {
            RoundNum++;
        }
    } while (lives > 0);

    // Close the grid up.
    document.getElementById("GameTwoGrid").innerHTML = "";
    
    // Put the text on the end screen.
    document.getElementById("GameTwoEndScreenTextStart").innerHTML = "Good job! You got <b>" + RoundNum + "</b> rounds correct!";

    // Show the end scren for the game.
    document.getElementById("GameTwoEndScreen").hidden = false;
    document.getElementById("GameTwoGame").hidden = true;

    // Send the data. 
    PostToModule("SethPostGame.js", JSON.stringify({
        username: username,
        pseudopassword: pseudopassword,
        round: {
            game: 2,
            stats: RoundNum.toString()
        }
    }))
}

function SetGameTwoLives(lives) {
    // Set the lives counter.
    let LifeIcon = document.createElement("img");
    LifeIcon.className = "LifeIcon"; LifeIcon.src = "./Test_Images/Pixel_Heart@5x.png";

    const LivesDisplay = document.getElementById("GameTwoLives");
    // Wipe anything inside it already.
    LivesDisplay.innerHTML = "";
    for (let i = 0; i < lives; i++)
        LivesDisplay.appendChild(LifeIcon.cloneNode());
}

/** @type {[[Node]]} */ let ClickedBoxes, 
/** @type {[[Node]]} */ GameTwoBoxes = [];
function MakeGameTwoGrid(Count, NumTurnedOn) {
    return new Promise(async (resolve, reject) => {
        // First, wipe any blocks that were there before. 
        document.getElementById("GameTwoGrid").innerHTML = "";

        // Make a default memoryBlock.
        const DefaultBox = document.createElement("memoryBlock")
            DefaultBox.style = "background-color: black";

        // Make the grid.
        let grid = document.createElement("div");
        grid.style = "display: block;";

        // Clear grids.
        GameTwoBoxes = ClickedBoxes = [];
        for (let i = 0; i < Count; i++) {
            // Make up a div for each row.
            let div = document.createElement("div");
            div.style = "display: flex; flex-direction: row;"
            GameTwoBoxes[i] = [];
            ClickedBoxes[i] = [];
            for (let j = 0; j < Count; j++) {
                let box = DefaultBox.cloneNode();
                if (j == Count - 1) {
                    box.style = "background-color: black; margin-right: 0px;"
                }

                const toggleColor = () => {
                    return new Promise((resolve, reject) => {
                        // Only change colors if we're clickable.
                        if (box.clickable && box.correct) {
                            let boxIsBlack = box.style.backgroundColor == "black";
                            console.log(`Box[${i}][${j}] clicked. Is Black ${boxIsBlack}. BackgroundColor: ${box.style.backgroundColor}`);
                            if (boxIsBlack) {
                                box.style.backgroundColor = "white";
                            } else {
                                box.style.backgroundColor = "black";
                            }

                            // Toggle the box on the grid.
                            if (ClickedBoxes[i] == undefined) ClickedBoxes[i] = [];

                            ClickedBoxes[i][j] = boxIsBlack;
                        } else if (box.clickable) {
                            GameTwoReportMisclick()
                        }

                        resolve();
                    })
                }
                box.addEventListener('click', toggleColor);
                box.click = toggleColor;
                GameTwoBoxes[i][j] = box;
                div.appendChild(box);
            }
            grid.appendChild(div);
        }

        // Put the grid on screen. 
        document.getElementById("GameTwoGrid").appendChild(grid);

        // Now, select a few random boxes and turn their colors on.
        for (let i = 0; i < NumTurnedOn; i++) {
            let x, y;
            x = Math.floor(Math.random() * Count), y = Math.floor(Math.random() * Count);

            // Mark the box as correct.
            let box = GameTwoBoxes[x][y];

            // If this box was already marked as correct, retry.
            if (box.correct) {
                i--;
                continue;
            }

            box.correct = true;

            // To be lazy, temporarily make the box clickable, then click it to change its color.
            box.clickable = true;
            await box.click();
            box.clickable = false;

            GameTwoBoxes[x][y] = box;
        }

        resolve();
    })
}

async function StartGameThree() {
    // Select a question based off of time.
        // For the moment, let's just do whatever and assume 1~12 works.
    let min, max;

    min = 1, max = 12;

    for (let i = min; i <= max; i++) {
        // Load the question and its answers.
        const answerNumber = LoadGame3Images(i);

        // Update the text.
        document.getElementById("Game3Progress").innerText = `${i}/${max}`;

        // Wait for a total of 15 seconds while updating the timer incrementally. 
        for (let j = 0; j <= 15; j++) {
            let timeLeft = (15 - j).toString();
            if (timeLeft.length == 1) timeLeft = "0" + timeLeft
            document.getElementById("Game3Time").innerText = `0:${timeLeft}`;
            await Wait(1000);
        }

        // TODO: Do correct stuff or whatever. Make sure to use OverText. 
    }
}

/**
 * Shuffles an array, modifying the original.
 * @param {[*]} array 
 */
function ShuffleArray(array) {
    let lastSwap = -1, lastSource = -1;
    for (let i = 0; i < array.length; i++) {
        let source = lastSource, swap = lastSwap;

        // Generate random swaps that aren't the same as the last ones.
        do {
            source = Math.floor(Math.random() * array.length)
        } while (source == lastSource)
        
        do {
            swap = Math.floor(Math.random() * array.length)
        } while (swap == lastSwap)
        
        let temp = array[source];
        array[source] = array[swap];
        array[swap] = temp;
    }
    return array;
}

/**
 * Loads the images randomly and returns the id of the box the answer is under.
 * @param {Number} QuestionNumber The question index on server.
 */
function LoadGame3Images(QuestionNumber) {
    let dir = `./Test_Images/Part_3_Images/Q${QuestionNumber}/`;
    const Game3Q = document.getElementById("Game3Question");
    Game3Q.src = `${dir}question.png`

    let imageIndex = ShuffleArray([1, 2, 3, 4]);
    for (let i = 1; i <= 4; i++) {
        let id = `Game3Answer${i}`;
        document.getElementById(id).src = `${dir}${imageIndex[i - 1]}.png`
    }

    return `Game3Answer${imageIndex.indexOf(1) + 1}`;
}

const Stages = [StageOne, EnsureSignedUpAndShowGameOne, ShowGameTwoHideGameOne]
/** @param StageNum {Number}*/
async function DoStage(StageNum) {
    await Stages[StageNum]();
}