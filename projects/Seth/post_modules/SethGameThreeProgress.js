/* NOTE: Deprecated, replaced by general GetProgress.

Example Data:
{
    username: "SethChavez12345"
}

NOTE: Does not require password since this isn't really sensetive information.
*/

const UserFolderPath = "./projects/Seth/users/", fs = require('fs');
data = JSON.parse(data);
const userpath = `${UserFolderPath}${data.username}.json`;
// Load the user's file.
if (fs.existsSync(userpath))
    fs.readFile(userpath, (err, user) => {
        // Parse data.
        user = JSON.parse(user);

        // Check for game three records.
        let roundNum = 0;
        user.rounds.forEach(round => {
            if (round.game == 3) {
                roundNum++;
            }
        });

        // At the end, send it back to the user.
        const end = {
            successful: true,
            roundNum: roundNum
        };

        res.end(JSON.stringify(end));
    })
else 
    res.end(JSON.stringify({
        sucessful: false,
        reason: "Something went wrong! (Probably invalid login.)",
    }));