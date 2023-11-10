/* Example Data:
{
    username: username,
    pseudopassword: pseudopassword
}
*/

const UserFolderPath = "./projects/Seth/users/", fs = require('fs');
data = JSON.parse(data);

// See if there's a user already named the username.
fs.readdir(UserFolderPath, (e, files) => {
    const UserFilePath = data.username
        // Sanatize path!
        .replace(/[/\\?%*:|"<>]/g, '-') 
        + ".json";
    for (let i = 0; i < files.length; i++) {
        if (files[i].toLowerCase().trim() == UserFilePath.toLowerCase().trim())
            return res.end(JSON.stringify({
                sucessful: false,
                reason: "User already exists!"
            }));
    }

    // Getting here means there's no profile already made for this, so go ahead and write it.
    /*
    // DEBUG: Don't actually write it.
    return res.end(JSON.stringify({
        sucessful: true
    }));
    */
    
    // Reformat the data to be safe. (Strip any weird values that might be attached.)
    data = {
        username: data.username,
        pseudopassword: data.pseudopassword
    }

    fs.writeFile(UserFolderPath + UserFilePath, JSON.stringify(data), (e) => {
        if (e) console.log(e)
        else {
            res.end(JSON.stringify({
                sucessful: true
            }))
        }
    })
});