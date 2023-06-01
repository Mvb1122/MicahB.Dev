// Load sets to be merged:
const fs = require('fs')
let sets = ['./6023102494550727.json', './6023102494550728.json'];
for (let i = 0; i < sets.length; i++) {
    // Load set data.
    sets[i] = JSON.parse(fs.readFileSync("./Sets/" + sets[i]));
}

function GetOtherSetsX(X, SpliceChar) {
    let otherValues = "";
    for (let j = 1; j < sets.length; j++) {
        let SetOther = eval(`sets[${j}].${X}`);

        // If this value doesn't match a previous value and isn't empty, incldue it.
        if (SetOther != "" && !(otherValues + eval(`sets[0].${X}`)).includes(SetOther)) otherValues += SpliceChar + SetOther.toString().trim();
    }
    return otherValues
}

// Put all answers on the first set.
    // Find set with shortest length.
let minLength = 100000000;
for (let i = 0; i < sets.length; i++) if (sets[i].Set.length < minLength) minLength = sets[i].Set.length;

for (let i = 0; i < minLength; i++) {
    let header = Object.keys(sets[0].Set[i])[0];

    // Get values from other sets.
    let otherValues = GetOtherSetsX(`Set[${i}]['${header}']`, "/");

    sets[0].Set[i][header] = (sets[0].Set[i][header] + otherValues).trim();

}

// Also merge notes and names.
sets[0].Notes += GetOtherSetsX("Notes", "\n");
sets[0].ObjectName += GetOtherSetsX("ObjectName", "/")
sets[0].AnswerName += GetOtherSetsX("AnswerName", "/")

// Write out the combined set.
fs.writeFileSync("./Combined_Set.json", JSON.stringify(sets[0]));
// console.log(sets[0])