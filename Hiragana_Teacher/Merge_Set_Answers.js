// Load sets to be merged:
const fs = require('fs')
let sets = ['./6023102494550727.json', './6023102494550728.json'];
for (let i = 0; i < sets.length; i++) {
    // Load set data.
    sets[i] = JSON.parse(fs.readFileSync("./Sets/" + sets[i]));
}

// Put all answers on the first set.
    // Find set with shortest length.
let minLength = 100000000;
for (let i = 0; i < sets.length; i++) if (sets[i].Set.length < minLength) minLength = sets[i].Set.length;

for (let i = 0; i < minLength; i++) {
    let header = Object.keys(sets[0].Set[i])[0];

    // Get values from other sets.
    let otherValues = "";
    for (let j = 1; j < sets.length; j++) if (sets[j].Set[i][header] != "") otherValues += "/" + sets[j].Set[i][header].trim();

    sets[0].Set[i][header] = (sets[0].Set[i][header] + otherValues).trim();
}

// Write out the combined set.
fs.writeFileSync("./Combined_Set.json", JSON.stringify(sets[0]));