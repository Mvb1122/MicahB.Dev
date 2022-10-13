const fs = require('fs');
const http = require('http');
const host = require('os').hostname();;
const port = 80;

const mimeTypes = {
    "txt": "text/plain",
    "html": "text/html",
    "gif": "image/gif",
    "ico": "image/x-icon",
    "json": "application/json",
    "mp3": "audio/mpeg",
    "mp4": "video/mp4",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "pdf": "application/pdf",
    "svg": "image/svg+xml",
    "wav": "audio/wav",
    "css": "text/css",
    "php": "text/html"
} 

// Note: php is declared as html content because the MTGA game dev website uses it as HTML for some reason.
const getMime = (s) => {
    for (const p in mimeTypes) {
        if (s.endsWith(p)) return mimeTypes[p];
    }
    return getMime("txt");
}

// Implement a simple cache for index.html files, which should recieve more traffic than other files.
let File_Cache = [];
function GetFileFromCache(url) {
    if (File_Cache[url])
        return File_Cache[url]
    
    File_Cache[url] = fs.readFileSync(url)
    console.log(`File committed to cache! ${url}`);
    return File_Cache[url];
}

const requestListener = function (req, res) {
    console.log("\n\nRequest Recieved: " + req.url);
    console.log(req.method);
    let localURL; 
    if (req.url.indexOf(".") == -1 && !req.url.includes("&") && !req.url.endsWith("/")) 
    {
        // If this is a malformed index.html request, forward the user to the actual page.
        res.setHeader("Location", req.url + '/');
        res.writeHead(301);
        return res.end();
    }
    if (req.url.startsWith('/'))
        localURL = '.' + req.url;
    else
        localURL = "./" + req.url;
    localURL = unescape(localURL);

    // Split off arguments, if they exist.
    let args = { cache: "true" };
    if (localURL.includes('&')) {
        args = parseQuery(localURL.substring(localURL.indexOf("&")));
        localURL = localURL.substring(0, localURL.indexOf("&"))
    }

    // Also, set the CORS policy so the www domain can also access stuff.
    res.setHeader("Access-Control-Allow-Origin", "*");
        
        // GETTING:
    if (req.method === "GET") {
        if (req.url.startsWith("/json/") || req.url.startsWith("/JSON/") || req.url.startsWith("/mDB/")) {
            url = './mDB/' + req.url.slice("/json/".length - 1);
            console.log(`Processed URL: ${url}`);
            let output = "";
            try {
                res.setHeader("Content-Type", "application/json");
                output = fs.readFileSync(url);
                res.writeHead(200);
                res.end(output);
            } catch (e) {
                res.setHeader("Content-Type", "text/plain");
                res.statusCode = 404;
                res.end("Not found.")
            }
        } else if (localURL.endsWith("/") && fs.existsSync(localURL + "index.html")) {
            // Handle reading index.html files if there's just a slash at the end.
            res.setHeader("Content-Type", "text/html");
            res.writeHead(200);
            let output;
            if (args.cache == "false") output = fs.readFileSync(localURL + "index.html");
            else output = GetFileFromCache(localURL + "index.html");
            res.end(output);
        } else if (req.url === "/favicon.ico") {
            res.setHeader("Content-Type", "image/x-icon");
            let s = fs.createReadStream('./favicon.ico');
            s.on('open', function () {
                res.setHeader('Content-Type', "image/x-icon");
                s.pipe(res);
            });
        } else if (req.url === "/logo_small_inverted.png") {
            res.setHeader("Content-Type", "image/png");
            let s = fs.createReadStream('./logo_small_inverted.png');
            s.on('open', function () {
                res.setHeader('Content-Type', "image/png");
                s.pipe(res);
            });
        } else if (req.url.startsWith("/users/")) {
            try {
                res.setHeader("Content-Type", "application/json");
                output = fs.readFileSync("." + req.url);
                res.writeHead(200);
                res.end(output);
            } catch (e) {
                res.setHeader("Content-Type", "text/plain");
                res.statusCode = 404;
                res.end("Not found, Searched for file: ." + req.url);
            }
            
            // Process requests for series images
        } else if (req.url.startsWith("/seriesImages/")) {
            let fileName = req.url.split("/");
            let localURL = './seriesImages/' + fileName[fileName.length - 1];
            console.log(localURL);
            if (fs.existsSync(localURL)) {
                try {
                    let s = fs.createReadStream(localURL);
                    res.setHeader("Content-Type", "image/png");
                    s.on('open', function () {
                        res.setHeader('Content-Type', "image/png");
                        s.pipe(res);
                    });
                } catch (error) {
                    res.setHeader("Content-Type", "text/plain");
                    res.statusCode = 404;
                    res.end("Not found, Local URL: " + localURL + "\nError Code:\n" + error);
                }
            } else {
                res.setHeader("Content-Type", "text/plain");
                res.statusCode = 404;
                res.end("Not found, Local URL: " + localURL);
            }
            
        } else if (req.url.startsWith("/seriesNumber.json")) {
            let listOfFiles = fs.readdirSync('./mDB/', { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
            let numberOfExistingStrigoi = parseInt(listOfFiles[listOfFiles.length - 1]);
            let newStrigoiNumber = numberOfExistingStrigoi + 1

            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end("{\n\t\"number\": " + newStrigoiNumber + "\n}");

        // Handle module requests.
        } else if (req.url.includes("/Modules/")) {
            console.log("Modules request for:" + localURL)
            // Run the specified file, if it exists and isn't a directory.
                // Modules should always be cached to reduce disk wear and decrease latency!
            if (fs.existsSync(localURL) && !fs.lstatSync(localURL).isDirectory()) {
                let script = GetFileFromCache(localURL).toString();
                eval(script)
            } else {
                res.statusCode = 404;
                res.setHeader("Content-Type", "text/plain");
                res.end("Module Not Found!");
            }
        } else {
            // Generally try to read any given file (that's not a directory), throw 404 if it doesn't work.
            if (fs.existsSync(localURL) && !fs.lstatSync(localURL).isDirectory()) {
                try {
                    let mime = getMime(localURL);
                    let s = fs.createReadStream(localURL);
                    res.setHeader("Content-Type", mime);

                    s.on('open', function () {
                        res.setHeader('Content-Type', mime);
                        s.pipe(res);
                    });
                } catch (error) {
                    res.setHeader("Content-Type", "text/plain");
                    res.statusCode = 404;
                    res.end("Not found, Local URL: " + localURL + "\nError Code:\n" + error);
                }
            } else {
                res.setHeader("Content-Type", "text/plain");
                res.statusCode = 404;
                res.end("Not found, Local URL: " + localURL);
            }
        }

        // POSTING:
    } else if (req.method === "POST") {
        // Asyncrounously download data and process the request at the same time.
        let data = "";
            // This runs asynchronously... probably.
        req.on('data', chunk => {
            data += chunk;
        });

        // Archaic Strigoi code... No good.
        if (req.url.startsWith("/users/") || req.url.startsWith("/seriesImages/") || req.url.startsWith("/mDB/") || req.url.startsWith("/json/")) {
            res.setHeader("Content-Type", "text/plain");
            res.writeHead(200);
            req.on('end', () => {
                inputURL = req.url.replace("/json/", "/mDB/");

                // Ensure that path to write to exists:
                let inputPath = "./";
                let inputArr = inputURL.split("/");
                for (let i = 0; i < inputArr.length - 2; i++) {
                    inputPath += inputArr[i + 1] + "/";
                    if (!fs.existsSync(inputPath)) {
                        fs.mkdirSync(inputPath);
                    }
                }   
                console.log(inputPath);
            
                // Write data:
                fs.writeFile(`./${inputURL}`, data.replace("\\n", "\\\n"), (e) => {res.end("Complete: " + data + "\nURL: " + req.url + "\n Error: " + e);});
            })
        }

        // Ascertain a modules request and process it the better way.
        if (req.url.toLowerCase().includes("post_modules")) {
            console.log(`Post_Modules request for ${localURL}`);
            if (fs.existsSync(localURL))
            {    
                req.on('end', () => {
                    // Because stuff can sometimes get a bit funky, allow post modules to use async/await.
                        // Also cache them to make stuff go faster.
                    eval("async function f() {" + GetFileFromCache(localURL).toString() + "} f();");
                })
            }
            else {
                res.statusCode = 404;
                res.setHeader("Content-Type", "text/plain");
                res.end("Module Not Found!");
            }
        }
        else {
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.end("Endpoint Not Found!");
        }
    }
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});

// Stolen from StackOverflow ;) 
function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}

// Run ESports setup stuff.
const global = {};
eval(fs.readFileSync("Esports_Projects/Esports_Index.js").toString());

// Run Hiragana Teacher stuff.
eval(fs.readFileSync('Hiragana_Teacher/Hiragana_Teacher_Index.js').toString());