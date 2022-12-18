// let listOfWords = []
let index = 0;
let back = () => move(-1);
let foward = () => move(1);

function move(dist) {
    // Move the index back by one, loop it to the start if it passes by the end or to the end from the beginning.
    index = (index + dist) % listOfWords.length;
    if (index < 0) index = listOfWords.length - 1;
    
    document.getElementById("card_front").innerHTML = "<br>" + listOfWords[index].front + "<br>" + "<br>";
    document.getElementById("card_back").innerHTML = "<br>" + listOfWords[index].back + "<br>" + "<br>";
}