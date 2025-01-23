const fs = require('fs'); const fp = require('fs/promises');
/* Example input data:
{
    "term": "Genki II",
    "limit": 5 // Default 5.
}

Example output data:
{
    results: [ // Results sorted by similarity to term.
        {name: "Genki 2", id: 1234, score: 1234 }
    ]
}
*/

/**
 * 
 * @param {string} string 
 * @param {string[]} terms 
 * @returns {Number}
 */
function SimilarityToTerms(string, terms) {
    const stringWords = string.toLowerCase().split(" ");

    // Split by words and return how many are included in the term. 
    let o = 0;

    // Return 100 points if it's an exact match.
        // This should ensure that exact matches consistently rank as the top.
    if (terms.length == 1 && terms[0] == string) return 100;

    for (let i = 0; i < terms.length; i++) {
        const part = terms[i];
        if (stringWords.includes(part.toLowerCase())) o++;
    }
    
    return o;
}

// Check if that person's progress exists.
const SetsDir = __dirname + "/Hiragana_Teacher/Sets/";
res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
let postData = JSON.parse(data)
if (postData.term) {
    if (!postData.limit) postData.limit = 5;

    const splitTerm = postData.term.toLowerCase().split(" ");

    // Use a promise array to asynchronously read all files.
        // Speeds up response time.
        
    const promises = fs.readdirSync(SetsDir).map(async v => {
        // v is filename.
        const data = JSON.parse(await fp.readFile(SetsDir + v));

        return {
            "name": data.Name,
            "id": v,
            "score": SimilarityToTerms(data.Name, splitTerm)
        }
    });

    const results = (await Promise.all(promises))
        .sort((a, b) => b.score - a.score) // Sort low to high, take highest few.
        .slice(0, postData.limit);

    return res.end(JSON.stringify({
        "results": results
    }));

} else 
    // Send back an empty result series if there's no 
    return res.end(JSON.stringify({"results":[]}));