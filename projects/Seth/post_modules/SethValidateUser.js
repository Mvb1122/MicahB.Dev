/* Example Data:
{
    username: username,
    pseudopassword: pseudopassword
}

Returned data:
{
    sucessful: true,
    IsExperimental: true
}
*/

const UserFolderPath = "./projects/Seth/users/", fs = require('fs');
data = JSON.parse(data);

// Load the user's file.
try {
    const UserPath = data.username
        // Sanitize path!
        .replace(/[/\\?%*:|"<>]/g, '-')
        + ".json";

    /**
 * @type {{username: String, pseudopassword: Number, questionnaire: {EarlyMorningActivities: string; HoursOfSleep: string; BedTime: string; WakeTime: string; Sex:  string; Age:  string; Grade: string;}}}
 */
    let user = JSON.parse(fs.readFileSync(UserFolderPath + UserPath));

    // Check the user's submitted information with what's actually there.
    if (user.pseudopassword == data.pseudopassword && user.username == data.username) {
        return res.end(JSON.stringify({
            sucessful: true,
            IsExperimental: user.questionnaire.EarlyMorningActivities
        }))
    } else {
        return res.end(JSON.stringify({
            sucessful: false,
            reason: "Invalid login!"
        }))
    }
} catch (e) {
    // If there's any errors, just tell them that something went wrong.
    console.log(e)
    res.end(JSON.stringify({
        sucessful: false,
        reason: "Something went wrong. (Probably invalid login.)",
    }))
}