const UserFolderPath = "./projects/Seth/users/", fs = require('fs');
data = JSON.parse(data);

// Load the user's file.
try {
    const UserPath = `${UserFolderPath}${data.username}.json`;
    /**
     * @type {{username: String, pseudo}}
     */
    let user = JSON.parse(fs.readFileSync(UserPath));
    
    // Put the round on there.
    if (user.rounds == undefined) user.rounds = [];

    const now = new Date(Date.now())
    let timestamp = `${now.getMonth() + 1}/${now.getDay() + 1}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}`;
    const round = {
        game: data.round.game,
        stats: data.round.stats,
        timestamp: timestamp
    }

    user.rounds.push(round)

    // Write it out.
    fs.writeFile(UserPath, JSON.stringify(user), (e) => {
        if (e) console.log(e)
        else {
            res.end(JSON.stringify({
                sucessful: true
            }))
        }
    })
} catch (e) {
    // If there's any errors, just tell them that something went wrong.
    console.log(e)
    res.end(JSON.stringify({
        sucessful: false,
        reason: "Something went wrong. (Probably invalid login.)",
    }))
}