const fs = require('fs');
const http = require('http');
const zlib = require('zlib');
const DEBUG = false;

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
    "png": "image/png",
    "pdf": "application/pdf",
    "svg": "image/svg+xml",
    "wav": "audio/wav",
    "css": "text/css",
    "php": "text/html",
    "avif": "image/avif"
} 

// Note: php is declared as html content because the MTGA game dev website uses it as HTML for some reason.
const getMime = (s) => {
    for (const p in mimeTypes) {
        if (s.endsWith(p)) return mimeTypes[p];
    }
    return getMime("txt");
}

// Implement a simple cache for files, which should recieve more traffic than other files.
let File_Cache = [];
function GetFileFromCache(url) {
    if (!DEBUG && File_Cache[url])
        return File_Cache[url]
    
    File_Cache[url] = fs.readFileSync(url)
    console.log(`File committed to cache! ${url}`);
    return File_Cache[url];
}

// Returns the size of a file in Megabytes.
function GetFileSizeInMegabytes(url) {
    return fs.statSync(url).size / (1024*1024);
}

const requestListener = async function (req, res) {
    if (DEBUG) console.log("\n\nRequest Recieved: " + req.url);
    if (DEBUG) console.log(req.method);
    
    // If this request isn't for the main micahb.dev site, change the localURL to target that site's folder, but only if it exists.
    let host = "";
    if (req.headers.host != null) host = req.headers.host.toString().replace("www", "")
    let localURL = ""; 
    if (!host.includes("micahb.dev")) {
        let hostPath = `./${host}/`;
        if (fs.existsSync(hostPath))
            localURL = hostPath;
    };

    if (req.url.indexOf(".") == -1 && !req.url.includes("&") && !req.url.endsWith("/")) 
    {
        // If this is a malformed index.html request, forward the user to the actual page.
        res.setHeader("Location", req.url + '/');
        res.writeHead(301);
        return res.end();
    }
    if (req.url.startsWith('/'))
        localURL += '.' + req.url;
    else
        localURL += "./" + req.url;

    localURL = unescape(localURL);

    // Split off arguments, if they exist.
    let args = { };
    if (localURL.includes('?')) {
        args = parseQuery(localURL.substring(localURL.indexOf("?")));
        localURL = localURL.substring(0, localURL.indexOf("?"))
    }

    if (localURL.includes('&')) {
        args = parseQuery(localURL.substring(localURL.indexOf("&")));
        localURL = localURL.substring(0, localURL.indexOf("&"))
    }

    // Also, set the CORS policy so the www domain can also access stuff.
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (DEBUG) console.log("Request for LocalURL at " + localURL)

    // Set compression on all non-image/video requests.
    // if (req.headers["accept-encoding"] != null) {
    res.EndWithCompression = (buffer) => {
        let acceptEncodingHeader = req.headers["accept-encoding"];
        if (acceptEncodingHeader.includes("gzip") || acceptEncodingHeader.includes("x-gzip")) {
            res.setHeader("Content-Encoding", "gzip"); 
            try {
                // Compress with GZip and then Gunzip
                let oldLength = buffer.length
                zlib.gzip(buffer, (err, buffer) => {
                    console.log(`Compressed from ${buffer.length} to ${oldLength}!`);
                    res.end(buffer)
                });
            } catch (e) {
                console.log(e);
                res.end(buffer);
            }
        } else {
            res.end(buffer);
        }
    }
        
        
        // GETTING:
    if (req.method === "GET") {
        if (req.url.startsWith("/json/") || req.url.startsWith("/JSON/") || req.url.startsWith("/mDB/")) {
            url = './mDB/' + req.url.slice("/json/".length - 1);
            if (DEBUG) console.log(`Processed URL: ${url}`);
            let output = "";
            try {
                res.setHeader("Content-Type", "application/json");
                output = fs.readFileSync(url);
                res.setHeader("Content-Length", Buffer.byteLength(output, 'utf8'))
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
            let output;
            if (args.cache == "false") output = fs.readFileSync(localURL + "index.html");
            else output = GetFileFromCache(localURL + "index.html");
            res.setHeader("Content-Length", Buffer.byteLength(output, 'utf8'))
            res.writeHead(200);
            res.end(output);
        } else if (req.url.startsWith("/users/")) {
            try {
                res.setHeader("Content-Type", "application/json");
                output = fs.readFileSync("." + req.url);
                res.writeHead(200);
                res.setHeader("Content-Length", Buffer.byteLength(output, 'utf8'))
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
            if (DEBUG) console.log(localURL);
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
            if (DEBUG) console.log("Modules request for:" + localURL)
            // Run the specified file, if it exists and isn't a directory.
                // Modules should always be cached to reduce disk wear and decrease latency.
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
                    res.setHeader("Content-Type", mime);

                    // If this is an AI image file, tell the user's device to cache it; those images don't usually change very often.
                        // (Cache for 1 week.)
                    if (mime.includes("image") && localURL.includes("AI"))
                        res.setHeader("Cache-Control", "max-age=604800")

                    // Cache requests for index files. Alternatively, the line to cache files smaller than 10MB is below..
                        // || GetFileSizeInMegabytes(localURL) < 10
                    if (localURL.includes("index") || localURL.includes("favicon")) {
                        var stats = fs.statSync(localURL)
                        var fileSizeInBytes = stats.size;
                        res.setHeader("Content-Length", fileSizeInBytes)
                        res.end(GetFileFromCache(localURL));
                    } else if (args.compress) {
                        var stats = fs.statSync(localURL)
                        var fileSizeInBytes = stats.size;
                        res.setHeader("Content-Length", fileSizeInBytes)
                        res.EndWithCompression(GetFileFromCache(localURL));
                    } else {
                        let s = fs.createReadStream(localURL);
                        var stats = fs.statSync(localURL)
                        var fileSizeInBytes = stats.size;
                        res.setHeader("Content-Length", fileSizeInBytes)
                        s.on('open', function () {
                            res.setHeader('Content-Type', mime);
                            s.pipe(res);
                        });
                    }
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
        // Asyncrounously download data.
        var binary_data = [];
            // This runs asynchronously... 
        req.on('data', function(chunk) {
            binary_data.push(chunk);
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

                if (DEBUG) console.log(inputPath);
            
                // Write data:
                fs.writeFile(`./${inputURL}`, data.replace("\\n", "\\\n"), (e) => {
                    res.end("Complete: " + data + "\nURL: " + req.url + "\n Error: " + e);
                });
            })
        }

        // Ascertain a modules request and process it the better way.
            // Only run this if the file is a .js file and in a post_modules directory.
        if (req.url.toLowerCase().includes("post_modules")) {
            if (DEBUG) console.log(`Post_Modules request for ${localURL}`);
            if (fs.existsSync(localURL))
            {    
                req.on('end', () => {
                    let data; 
                    if (!req.url.includes("Upload.js")) {
                        data = Buffer.concat(binary_data).toString();
                        if (DEBUG) console.log("Input: `" + data + "`");
                    } else {
                        data = Buffer.concat(binary_data);
                    }

                    // Because stuff can sometimes get a bit funky, allow post modules to use async/await.
                        // Also cache them to make stuff go faster.
                    try {
                        if (localURL.endsWith(".js"))
                            eval("async function f() {" + GetFileFromCache(localURL).toString() + "} f();");
                        else {
                            res.statusCode = 403;
                            res.setHeader("Content-Type", "application/json");
                            return res.end(JSON.stringify({
                                sucessful: false,
                                reason: "You are not authorized to write to this location."
                            }));
                        }
                    } catch (err) {
                        if (DEBUG) console.log(err);
                    }
                })
            } else {
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

const host = '192.168.1.3' // require('os').hostname();
const port = 80;

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});

// Stolen from StackOverflow ;) 
function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        try {
            var pair = pairs[i].split('=');
            query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        } catch (error) {
            if (DEBUG) {
                console.log("Pair: [" + pair[0] + "," + pair[1] + "]")
                console.log(error)
            }
        }
    }
    return query;
}

// Load persistant information.
const global = fs.existsSync("./Global.json") ? JSON.parse(fs.readFileSync("./Global.json")) : {};

// Run ESports setup stuff.
eval(fs.readFileSync("Esports_Projects/Esports_Index.js").toString());

// Run Hiragana Teacher stuff.
eval(fs.readFileSync('Hiragana_Teacher/Hiragana_Teacher_Index.js').toString());

// Run the AI Index stuff.
eval(fs.readFileSync("./FTP/AI/AI_Index.js").toString());;

// Save the global cache when the program is shut down.
process.on('SIGINT', function() {
    fs.writeFileSync("./Global.json", JSON.stringify(global));

    process.exit();
});