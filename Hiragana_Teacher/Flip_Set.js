// Configuration:
const setName = '1.json';
const TrimAfterFirstAnswer = false;


// Load set to be flipped:
const fs = require('fs')
const set = JSON.parse(fs.readFileSync("./Sets/" + setName));

// Swap values.
set.Name = set.Name.trim() + " Flipped"
const temp = set.AnswerName;
set.AnswerName = set.ObjectName;
set.ObjectName = temp;

// Swap individual answers.
const NewSet = [];
for (let i = 0; i < set.Set.length; i++) {
    const NewPair = {};
    const OldCharacter = Object.keys(set.Set[i])[0];
    
    let OldAnswer = set.Set[i][OldCharacter];
    // Remove after the first answer if desired.
    if (TrimAfterFirstAnswer)
        OldAnswer = OldAnswer.substring(0, OldAnswer.indexOf("/"))

    NewPair[OldAnswer.replace("/", "・")] = OldCharacter.replace("・", "/");
    NewSet.push(NewPair);
}
set.Set = NewSet;

// Write it out.
const path = "./Sets/" + setName.replace(".json", "_f.json");
fs.writeFile(path, JSON.stringify(set), (err) => {
    if (err) console.log(err);
    else console.log("File written to " + path);
});