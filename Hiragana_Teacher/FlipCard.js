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
}

function Print() {
    // Prepare screen for printing.
    let startingText = document.getElementById("body").innerHTML;
    let startingStyle = document.getElementById("body").style;
    let FlipCardCSS = document.getElementById("Flip_Card_CSS").innerHTML;
    let base = document.getElementById("MultiCardDisplay").innerHTML;

    // Clear the screen.
    document.getElementById("body").innerHTML = ""; // document.getElementById("MultiCardDisplay").innerHTML;
    document.getElementById("body").style.backgroundColor = "white";
    document.getElementById("body").style.display = "table";
    // document.getElementById("body").style.flexWrap = "wrap";

    // Reapply the CSS.
    let css = document.createElement("style");
    css.innerHTML = FlipCardCSS;
    document.getElementById("body").appendChild(css);

    // Add the actual cards.
    listOfWords.forEach(word => {
        let WordCard = base.replace("FrontText", word.front.trim()).replace("BackText", word.back.trim());
        document.getElementById("body").innerHTML += WordCard;
    });

    // Print page.
    window.print();

    // Return things to normal.
    document.getElementById("body").innerHTML = startingText;
    document.getElementById("body").style = startingStyle;
}