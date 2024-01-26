const fs = require('fs')
// Loop through all HTML & PHP files and return a txt file which contains them.
let prefix = "https://micahb.dev/";
let filePrefix = "D:/mDB/";
let list = "";

function checkDir(dir) {
    // console.log(`Checking ${dir}`);
    let files = fs.readdirSync(dir);

    files.forEach(file => {
        try {
            let fullPath = `${dir}/${file}`;
            // console.log(`File: ${fullPath}`);
            
            if (fullPath.endsWith("html") || fullPath.endsWith("php")) {
                // console.log(`File: ${file}`)
                list += `${prefix}${fullPath.substring(filePrefix.length)}\n`;
            } else if (fs.statSync(fullPath).isDirectory())
                checkDir(fullPath);
                
        } catch (e) {
            // If something goes wrong, just assume that this file wasn't important.
            return;
        }
    })
}

res.statusCode = 200;
checkDir(__dirname);
res.setHeader("Content-Type", getMime("json"));
res.end(list);