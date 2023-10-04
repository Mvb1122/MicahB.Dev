/**
 * @Mvb1122
 * Uses my other project's (https://github.com/Mvb1122/gpt3-Bot) AI microservice to make example sentences.
 */

/* Example:
{
    "Set": "123456",
    "Word": "えんぴつ",
    "ForceNew": false | true,
    "login_token": 123456
}
*/

const fs = require('fs');

// Use the AI Microservice to get an example sentence.
/**
 * @type {{Set: String, Word: String, ForceNew: Boolean}}
 */
let submitted = JSON.parse(data);

// First, make sure that they're actually logged in.
let userID = TokenToUserID(submitted.login_token);
let check = userID != -1
if (!check) {
    return res.end(JSON.stringify({
        successful: false,
        reason: "You're not actually logged in, faker."
    }))
}

// Look to see if the set already has an example for this.
const setPath = `Hiragana_Teacher/Sets/${submitted.Set}.json`;
const set = JSON.parse(fs.readFileSync(setPath));

// TODO: Fix this.
/* First of all, check that the set actually contains that word.
let contains = false;
for (let i = 0; i < set.Set.length; i++) {
    console.log(Object.keys(set.Set[i])[0])
    if (Object.keys(set.Set[i])[0].toString().trim() == submitted.Word.toString().trim()) contains = true;
}
if (contains) {
    return res.end(JSON.stringify({
        successful: false,
        reason: "Word is not in set.",
        set: set.Set
    }))
}
*/

const ShouldGenerate = !(set.examples != undefined && set.examples[submitted.Word] != undefined) || submitted.ForceNew;

// Send the request for a sentence to the microservice.
let AIResponse;
if (ShouldGenerate) {
    const url = 'http://192.168.1.3:7243';
    
    const data = JSON.stringify({
        role: "system",
        content: "Please write a very basic example sentence for the following word or phrase. Feel free to write a dialogue, but keep it simple. Do not write anything except for the example sentence. After you have written your example, please write an English translation beneath it. Only write the English translation once. Phrase: " + submitted.Word
    });
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: data,
    });

    AIResponse = (await response.json()).content;

    // Write this example onto the set's file. 
    if (set.examples == undefined) set.examples = {};
    set.examples[submitted.Word] = AIResponse;
    fs.writeFile(setPath, JSON.stringify(set), (e) => {
        if (e) console.log(e);
    })
} else {
    // Just return the last one.
    AIResponse = set.examples[submitted.Word];
}

// Finally, send the response back to the user.
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");

if (DEBUG) console.log(`Generated AI Example for ${submitted.Word}: ${AIResponse}`)

res.end(JSON.stringify({ "Example": AIResponse }));