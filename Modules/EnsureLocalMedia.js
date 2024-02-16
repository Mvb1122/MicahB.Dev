const LinkRegex = new RegExp(/(?<=\()(https?:\/\/[^\s)]+)(?=\))/g);
const fs = require('fs');
const https = require('https');

// Go through each Markdown file and look for its links.
let MediaPromise = [];
let AllLinks = [];

console.warn("Looking for Discord images!")

for (let i = 0; i < GlobalPaths.length; i++) {
    try {
        const path = await GlobalPaths[i];
        if (typeof (path) == 'string' && path.includes("md")) {
            const search = new Promise(res => {
                fs.readFile(path, (err, data) => {
                    const downloads = [];
                    if (err != null) {
                        if (DEBUG)
                            return console.log(err);
                        else return;
                    }

                    data = data.toString();
                    const matches = data.match(LinkRegex);
                    if (matches != null) {
                        matches.forEach(match => {
                            if (match.includes("cdn.discordapp.com") || match.includes("media.discordapp.net")) {
                                // Check if we've downloaded this.
                                const folder = path.substring(0, path.lastIndexOf("\\"));
                                console.log(folder);
                                AllLinks.push(match);
                                const end = match.includes("?") ? match.lastIndexOf("?") : match.length;
                                const safeName = match.substring(match.lastIndexOf("/") + 1, end).replace(/[/\\?%*:|"<>]/g, '-');

                                const MediaFolder = `${folder}/Media/`;
                                // If the folder doesn't exist or the file doesn't exist, download it.
                                // if (!(fs.existsSync(MediaFolder) && fs.existsSync(`${MediaFolder}${safeName}`))) {}
                                
                                // Ensure that the folder exists.
                                if (!fs.existsSync(MediaFolder))
                                    fs.mkdirSync(MediaFolder);

                                // Download the file if it's not downloaded.
                                if (!fs.existsSync(`${MediaFolder}${safeName}`)) {
                                    const NewFile = `${MediaFolder}${safeName}`;
                                    const file = fs.createWriteStream(NewFile);
                                    downloads.push(new Promise((resPromise) => {
                                        const request = https.get(match, function (response) {
                                            response.pipe(file);
    
                                            // after download completed close filestream
                                            file.on("finish", () => {
                                                file.close();
                                                
                                                const fileWasEmpty = fs.statSync(NewFile).size == 0;
                                                if (!fileWasEmpty) {
                                                    console.log(`Download Completed in ${MediaFolder}`);

                                                    // Now that we've got the media, rewrite the original file to link to it.
                                                    data = data.replaceAll(match, `./Media/${safeName}`);
                                                } else {
                                                    console.warn(`Invalid Discord link in ${safeName}!`);
                                                    
                                                    fs.unlink(NewFile, (e) => {
                                                        if (e) console.log(e);
                                                    })
                                                }
                                                
                                                // For testing always delete after 30 seconds.
                                                if (DEBUG)
                                                    setTimeout(() => {
                                                        fs.unlink(NewFile, (e) => {
                                                            if (e) console.log(e);
                                                        })
                                                    }, 30000);

                                                resPromise();
                                            });
                                        });
                                    }));
                                }
                            }
                        });
                    }

                    Promise.all(downloads).then(() => {
                        // Write out the modified file.
                        fs.writeFile(path, data, (err) => {
                            if (err) console.log(err);
                        })
                        res();
                    })
                })
            })
            MediaPromise.push(search);
        }
    } catch (e) {
        // Do nothing.
        continue;
    }
}

res.statusCode = 200;
res.setHeader("Content-Type", getMime("json"));
Promise.all(MediaPromise).then(() => {
    res.end(JSON.stringify({ successful: true, Links: AllLinks }));
})