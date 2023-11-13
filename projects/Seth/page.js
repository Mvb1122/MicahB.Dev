// On load, check if the user has a saved login.
if (localStorage.getItem("SethUsername") != null && localStorage.getItem("SethPassword") != null) {
    // First, validate login.
    LoginAs(localStorage.getItem("SethUsername"), localStorage.getItem("SethPassword"))
        .then(response => {
            console.log(response);
            
            if (response.sucessful) {
                // Show the returning user pane.
                ShowOnly("ReturningUserPane");
        
                // Set the username text.
                ["ReturningUsername", "ReturningUsername1"].forEach(id => {
                    document.getElementById(id).innerText = localStorage.getItem("SethUsername");
                })
            }
        })
} else {
    // If no saved login, just show the NonReturningUserPane. 
    ShowOnly("NonReturningUserPane");
}

/** @type {String} */
let username, 
/** @type {Number} */
pseudopassword; // Not an actual password!
function StageOne() {
    // First, hide the starting panel and go to the signup panel.
    ShowOnly("questionnaire");
}

let UserData, UsernamePrefix, IsExperimental;
function ShowUsernamePasswordScreen() {
    // Scrape all information.
    UserData = {
        EarlyMorningActivities: "Q1",
        HoursOfSleep: "Q2",
        BedTime: "Q3a",
        WakeTime: "Q3b",
        Sex: "Q4",
        Age: "Q5", 
        Grade: "Q6"
    };
    const keys = Object.keys(UserData)
    for (let i = 0; i < keys.length; i++) 
        UserData[keys[i]] = document.getElementById(UserData[keys[i]]).value

    // Ensure that they filled in all of the boxes.
    for (let i = 0; i < keys.length; i++) 
        if (UserData[keys[i]] == '') 
            return alert("Please fill in all of the boxes before continuing.");

    // Now, we can generate a prefix for them.
        // Parse IsExperimental to a bool.
    IsExperimental = UserData.EarlyMorningActivities = UserData.EarlyMorningActivities == "true";
    UsernamePrefix = `${(UserData.EarlyMorningActivities == "true" ? "E" : "C")}${UserData.Grade}_`
        // Show it on the screen.
    document.getElementById("UsernamePrefix").innerText = UsernamePrefix;

    // Generate a password. (Use half-decent randomness.)
    const array = new Uint32Array(1);
    self.crypto.getRandomValues(array);
    pseudopassword = array[0];
    document.getElementById("Password").innerText = pseudopassword;

    // Go to that screen.
    ShowOnly("UsernamePasswordScreen");
}

/** Returns a promise representing whether it was successful or not. */
function LoginAs(PassedUsername, password, SaveLogin = false) {
    return new Promise(async (resolve) => {
        let response = await PostToModule("SethValidateUser.js", JSON.stringify({
            username: PassedUsername,
            pseudopassword: password
        }));

        if (response.sucessful) {
            if (SaveLogin) { 
                // If we were successfully logged in, save the login information. 
                localStorage.setItem("SethUsername", PassedUsername);
                localStorage.setItem("SethPassword", password);
            }
    
            username = PassedUsername;
            pseudopassword = password;
            IsExperimental = response.IsExperimental;
            return resolve(response);
        } else 
            resolve(response)
    })
}

function Wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, 1000))
}

/**
 * Posts data to a specified server module and then returns the response in JSON.
 * @param {String} Module Module name, not including post_modules or anything.
 * @param {String} data Make sure to stringify data!
 * @param {Boolean?} AwaitInFunction Returns awaited result.
 * @returns {Promise<Object>} Data back from the server
 */
async function PostToModule(Module, data, AwaitInFunction = true) {
    // When uploading data, show the loading screen.
    let oldSection = undefined;
    try {
        if (CurrentlyShownSection != undefined) {
            oldSection = CurrentlyShownSection;
            ShowOnly("Loading");
        }
    } catch {;} // Do nothing.

    const url = `./Post_Modules/${Module}`; 
    const result = (await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: data,
    })).json();

    // Go back to wherever we were before.
    if (oldSection != undefined)
        ShowOnly(oldSection)
    
    if (AwaitInFunction)
        return await result
    else return result;
}

async function EnsureSignedUpAndShowGameOne() {
    // First, check that there's a username in the box.
    username = UsernamePrefix + document.getElementById("UserName").value;
    if (username.trim() == "")
        return alert("Please enter a username in the box.");
    else {
        // Show first game.
        ShowOnly("GameOneDescription")
        SetGameOneText();
        
        // Sign up.
        const data = JSON.stringify({
            username: username,
            pseudopassword: pseudopassword,
            questionnaire: UserData
        });
        const response = await PostToModule("SethSignup.js", data)

        if (response.sucessful == false) {
            alert("That user already exists! Please come up with a more original usename and try again.");
            return DoStage(0);
        } else {
            // Save the user's login info, since it's known-good now.
            localStorage.setItem("SethUsername", username);
            localStorage.setItem("SethPassword", pseudopassword);
        }
    }
}

async function ContinueTest() {
    // First, ask the server what test we're on.
    PostToModule("SethGetProgress.js", JSON.stringify({username: localStorage.getItem("SethUsername"), pseudopassword: localStorage.getItem("SethPassword")}))
        .then(e => {
            if (e.sucessful) {
                // Load the specified game.
                switch (e.game) {
                    case "1":
                        ShowOnly("GameOneDescription");
                        return;
                    case "2":
                        ShowOnly("GameOneDescription"); // ShowOnly("GameTwoDescription");
                        return;
                    
                    case "3a":
                        GameThreeRoundNumber = 0;
                        ShowOnly("GameOneDescription"); // ShowGameThree();
                        return;
                    
                    case "3b":
                        GameThreeRoundNumber = 1;
                        ShowOnly("GameOneDescription"); // ShowGameThree();
                        return;

                    case "3c":
                        GameThreeRoundNumber = 2;
                        ShowOnly("GameOneDescription"); // ShowGameThree();
                        return;
                }
            } else {
                alert("Something went wrong! Please try again.");
            }
        })

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
GameOneCurrentRound,
/** @type {[Number]} */
GameOneTimes = [],
/** @type {Number} */
GameOneStartTime;
async function StartGameOne() {
    // First, show the countdown.
    ShowOnly("GameOneCountDown")

    for (let i = 3; i >= 0; i--) {
        await new Promise((r) => {
            document.getElementById("GameOneCountDown").innerHTML = i == 0 ? "<b>Gooo!!!</b>" : i;
            setTimeout(() => {
                r();
            }, 1000);
        })
    }

    // After the countdown, go to the game.
    ShowOnly("GameOneGame")

    // Now that we're in the game, setup the record loop.
    for (let i = 0; i < 11; i++) {
        GameOneCurrentTextColor = SetGameOneText();

        // Start the timer.
        GameOneStartTime = performance.now();

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

    // AFter the game, update the text on the GameOneEndScreen
    let Compliment = ""
    if (GameOneNumCorrect < 3)
        Compliment = "Nice try!"

    else if (GameOneNumCorrect < 5)
        Compliment = "Good Job!";

    else if (GameOneNumCorrect < 9)
        Compliment = "So close!"
    
    else
        Compliment = "Perfect!"

    document.getElementById("GameOneEndScreenTextStart").innerHTML = `${Compliment} You got <b>${GameOneNumCorrect}</b> right out of ten!`;

    // Now, go to the Game One End screen.
    ShowOnly("GameOneEndSceen")

    // Also, now that we have the data, submit it.
    PostToModule("SethPostGame.js", JSON.stringify({
        username: username,
        pseudopassword: pseudopassword,
        round: {
            game: 1,
            stats: {
                score: GameOneNumCorrect.toString(),
                times: GameOneTimes
            }
        }
    }))

    // Clean up so that they can replay it if they want. (Remains only as a debug thing.)
    GameOneCurrentRoundNumber = GameOneNumCorrect = 0;
    GameOneTimes = [];
}

function EndGameOneRoundWithColor(color) {
    // End the timer, and record it if we're not on the practice round.
    const time = performance.now() - GameOneStartTime;
    if (GameOneCurrentRoundNumber >= 1 && color != "")
        GameOneTimes.push(time);

    // No color passed means no response.
    else if (GameOneCurrentRoundNumber >= 1 && color == "")
        GameOneTimes.push("No response!");
    
    const text = document.getElementById("GameOneText");
    text.style = "";

    // Check that the answer is correct and use the text containing correct/incorrect to see if it should be counted.
    const IsDisplayingCorrectText = document.getElementById("GameOneText").innerText.includes("orrect");
    if (GameOneCurrentTextColor.trim().toLowerCase() == color.trim().toLowerCase() && !IsDisplayingCorrectText) {
        // Ignore the practice round.
        if (GameOneCurrentRoundNumber >= 1)
            GameOneNumCorrect++;

        text.innerText = "Correct!";
        GameOneCurrentRoundNumber++; 
    } else if (!IsDisplayingCorrectText) {
        text.innerText = "Incorrect :("
        GameOneCurrentRoundNumber++; 
    }
}

async function ShowGameTwoHideGameOne() {
    ShowOnly("GameTwoDescription")
}

// Function reassigned later on.
let GameTwoReportMisclick = () => {

}

async function StartGameTwo() {
    // Show the div on screen and hide the intro and postgame divs.
    ShowOnly("GameTwoGame")

    // Setup the misclick thing.
    let lives = 3;
    GameTwoReportMisclick = () => {
        lives--;

        SetGameTwoLives(lives);
    }

    // At the start, set the lives to 3.
    SetGameTwoLives(lives);

    async function GameTwoRound(RoundNum) {
        return new Promise(async (EndRound) => {
            // Calculate Grid size.
            let GridSize;

            // For math: https://www.desmos.com/calculator/xoc92mxgk6
            if (RoundNum >= 5) { 
                // After round six, only increase grid size every fourth game.
                GridSize = Math.floor((RoundNum - 2) / 4) + 4
            } else {
                GridSize = Math.floor(RoundNum / 3) + 3;
            }

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
    ShowOnly("GameTwoEndScreen");

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
    LifeIcon.className = "LifeIcon"; LifeIcon.src = "./Test_Images/Seth Heart V2.svg";

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
        // Resize the boxes.
        let ScalePercentage = (80 / (Count * 2)).toPrecision(3); // <- Formula calculates what percent of the screen each box will be.
        // NOTE: When Count > 8, which is round 17 or greater, the grid will scale off of the user's screen!
        const sideScalePercentage = `min(${ScalePercentage}vh, ${ScalePercentage}vw)`;
        DefaultBox.style.width = sideScalePercentage;
        DefaultBox.style.height = sideScalePercentage;

        ScalePercentage = (ScalePercentage * 1/3).toPrecision(3);
        const marginScalePercentage = `min(${ScalePercentage}vh, ${ScalePercentage}vw)`;
        DefaultBox.style.marginRight = marginScalePercentage;
        DefaultBox.style.marginBottom = marginScalePercentage;
        DefaultBox.style.backgroundColor = "black";

        // Make the grid.
        let grid = document.createElement("div");
        // grid.style.display = "block";
        grid.style.width = "min(80vh, 80vw)";
        grid.style.aspectRatio = "1 / 1";

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
                    box.style.backgroundColor = "black;"
                    box.style.marginRight = "0%;";
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
        const GridDiv = document.getElementById("GameTwoGrid");
        GridDiv.appendChild(grid);

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

let GameThreeRoundNumber;
async function ShowGameThree() {
    // First show the description...
    ShowOnly("GameThreeDescription");
    
    // Fetch users' progress.
        // Commented-out code here is for the deprecated SethGameThreeProgress.js module.
    /* PostToModule("SethGameThreeProgress.js", JSON.stringify({username: username})).then(data => { */
    const data = {roundNum: GameThreeRoundNumber, IsExperimental}
    let text = "This time, you will be playing section " + (data.roundNum + 1);
    const SectionText = document.getElementById("GameThreeSectionDiv");
    SectionText.innerText = text;

    // Add the button.
    let button = document.createElement("button");
    button.onclick = StartGameThree;
    button.innerText = "Start Game Three!";
    
    SectionText.appendChild(document.createElement("br"));
    SectionText.appendChild(button);

    // GameThreeRoundNumber = data.roundNum;

    // Update the Part number text on the Game3EndScreen while we're here, just because it's easy.
    document.getElementById("GameThreePartNum").innerText = (IsExperimental ? 3 : 2) - data.roundNum;
    /* }) */

    // Update the description screen.
    document.getElementById("SectionThreeSessionCounter").innerText = IsExperimental ? "four" : "three";
    document.getElementById("SectionThreeQuestionTotal").innerText = IsExperimental ? "12" : "9";
}

function ArrayContains(arr, val) {
    for (let i = 0; i < arr.length; i++)
        if (arr[i] == val)
            return true;

    return false;
}

let GameThreeSelectedAnswerId = -1;
async function StartGameThree() {
    // Select a question based off of time.
        // Add 9 for each section. (There are 36 questions over 4 sections of 9 length)
    let min = 1, max = 9;
    min += 9 * GameThreeRoundNumber; max += 9 * GameThreeRoundNumber;

    let score = 0;
    let DoneQuestions = [];
    const numRounds = 3;
    for (let i = 1; i <= numRounds; i++) {
        // Choose a random question.
        let questionId = 1;
        do {
            questionId = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (ArrayContains(DoneQuestions, questionId));

        // Load the question and its answers.
        const answerId = LoadGame3Images(questionId);

        // Update the text.
        document.getElementById("Game3Progress").innerText = `${i}/${numRounds}`;

        // Show the game.
        ShowOnly("GameThreeGame");

        // Wait for a total of 15 seconds while updating the timer incrementally. 
        for (let j = 0; j <= 15; j++) {
            let timeLeft = (15 - j).toString();
            if (timeLeft.length == 1) timeLeft = "0" + timeLeft
            document.getElementById("Game3Time").innerText = `0:${timeLeft}`;
            await Wait(1000);
        }

        // Take tally of the score. 
        const IsCorrect = answerId == GameThreeSelectedAnswerId;
        if (IsCorrect) score++;

        // Tell the user if they were correct or not.
        const OverQuestion = document.getElementById("OverQuestion");
        OverQuestion.hidden = false;
        OverQuestion.innerText = (IsCorrect ? "Correct!" : "Incorrect! :(")

        // Do a break for like 3 seconds.
        document.getElementById("Game3Time").innerText = `0:03`;
        for (let j = 0; j <= 3; j++) {
            let timeLeft = (3 - j).toString();
            if (timeLeft.length == 1) timeLeft = "0" + timeLeft
            document.getElementById("Game3Time").innerText = `Break 0:${timeLeft}`;
            await Wait(1000);
        }

        // Hide OverQuestion and move on.
        OverQuestion.hidden = true;
    }

    // Show the end screen, or the final end screen based off of the remaining number of parts
    /* if (GameThreeRoundNumber != 2 ) */
        ShowOnly("GameThreeEndScreen");
    /* else 
        ShowOnly("EndPane"); */
        // ^ Instead of doing special logic, just don't ever show that last screen. (TODO: remove it, or find a better way to flow into it.)

    // Report score to server.
    let GamePart = "3", parts = "abcd".split("");
    GamePart += parts[GameThreeRoundNumber];

    const stats = {
        part: GamePart,
        score: score
    }

    // Send it to the server. 
    PostToModule("SethPostGame.js", JSON.stringify({
        username: username,
        pseudopassword: pseudopassword,
        round: {
            game: 3,
            stats: stats
        }
    }))
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

let GameThreeEventListeners = {};
/**
 * Loads the images randomly and returns the id of the box the answer is under.
 * @param {Number} QuestionNumber The question index on server.
 */
function LoadGame3Images(QuestionNumber) {
    let dir = `./Test_Images/Part_3_Images/Q${QuestionNumber}/`;
    const Game3Q = document.getElementById("Game3Question");
    Game3Q.src = `${dir}question.png`;

    // When loading, reset selected image.
    for (let j = 1; j <= 4; j++)
        document.getElementById(`Game3Answer${j}`).style.border = "";

    let imageIndex = ShuffleArray([1, 2, 3, 4]);
    for (let i = 1; i <= 4; i++) {
        let id = `Game3Answer${i}`;
        document.getElementById(id).src = `${dir}${imageIndex[i - 1]}.png`

        /**
         * @param {PointerEvent} event 
         */
        function listener(event) {
            // Unborder all of the other boxes.
            for (let j = 1; j <= 4; j++)
                document.getElementById(`Game3Answer${j}`).style.border = "";

            // Add a border to it.
            event.target.style.border = "medium solid red";

            // Set the answer.
            GameThreeSelectedAnswerId = event.target.id;

            console.log(`${GameThreeSelectedAnswerId}, from ${i}`);
        }

        // Add onclick listeners to it.
            // Remove old ones.
        if (GameThreeEventListeners[id] != undefined)
            document.getElementById(id).removeEventListener("click", GameThreeEventListeners[id]);
            // Add listener.
        document.getElementById(id).addEventListener("click", listener);
        GameThreeEventListeners[id] = listener;

    }

    console.log(`CorrectAnswer: Game3Answer${imageIndex.indexOf(1) + 1}`)
    return `Game3Answer${imageIndex.indexOf(1) + 1}`;
}

/** @param StageNum {Number}*/
function DoStage(StageNum) {
    const Stages = [StageOne, EnsureSignedUpAndShowGameOne, ShowGameTwoHideGameOne]
    Stages[StageNum]();
}