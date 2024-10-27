/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const http = require('http');
const zlib = require('zlib');
const Path = require('path')
const sharp = require('sharp');
const { Readable } = require('stream')
const DEBUG = false;

const mimeTypes = {
    "txt": "text/plain",
    "html": "text/html",
    "gif": "image/gif",
    "ico": "image/x-icon",
    "json": "application/json",
    "mp3": "audio/mpeg",
    "mp4": "video/mp4",
    "m4a": "audio/m4a",
    "ogg": "audio/ogg",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "pdf": "application/pdf",
    "svg": "image/svg+xml",
    "wav": "audio/wav",
    "css": "text/css",
    "php": "text/html", // Note: php is declared as html content because the MTGA game dev website uses it as HTML for some reason.
    "avif": "image/avif",
    "webm": "video/webm",
    "js": "text/javascript"
} 

/**
 * @param {String} name File term to search for.
 * @returns {[String]} Matching paths
 */
function FindFile(name) {
    if (DEBUG)
        console.log(`Searching for [${name}]`)
    
    return DeepSearchSync(name, GlobalPaths);
}

// For whatever reason this doesn't work but I'm just kinda leaving it here.
async function DeepSearchArray(arr, term) {
    arr = await Promise.all(arr);
    term = term.trim().toLowerCase();
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] != undefined) {
            /**
            * @type {String}
            */
            const CurrentItem = await arr[i];
            const type = typeof(CurrentItem).toString().toLowerCase();
            try {
                if (type == "string" && type != "undefined" && CurrentItem.includes(term)) {
                    return CurrentItem;
                }
            } catch (e) {
                console.log(typeof(CurrentItem));
                console.log(e);
                console.log(CurrentItem);
            }
        }
    }

    // We haven't returned yet, so deep search.
    for (let i = 0; i < arr.length; i++) {
        if (Array.isArray(arr[i])) {
            const SubSearch = await DeepSearchArray(arr[i], term);
            if (SubSearch != null)
                return SubSearch;
        }
    }

    // No return here, no value.
    return null;
}

/**
 * @param {[String] | [String | [String]]} arr Array to be searched
 * @param {String} term search term
 * @returns The value found or null if not found.
 */
function DeepSearchSync(term, arr) {
    term = term.trim().toLowerCase();
    let matches = [];
    function Process(array) {
        for (let i = 0; i < array.length; i++)
        if (array[i].includes && array[i].trim().toLowerCase().includes(term)) {
            matches.push(array[i]);
        } else if (typeof(array[i]) == Object) {
            Process(array[i])
        }
    }
    Process(arr);
    return matches;
}

const OutlawedPaths = ["node_modules", ".git", "FTP\\AI\\", "Rubbish"]
function ContainsOutlawedPath(path) {
    for (let i = 0; i < OutlawedPaths.length; i++) if (path.includes(OutlawedPaths[i])) return true;
    return false;
}

async function GetAllPaths(subdir = "", tier = 0) {
    let values = fs.readdirSync(`${subdir}`);
    values = values.map((val) => Path.join(subdir, val));
    const promises = [];
    for (let i = 0; i < values.length; i++) try {
        const path = values[i];
        promises.push(new Promise((resolve) => {
                fs.stat(path, async (err, stats) => {
                    if (err) console.log(err);
                    try {
                        if (stats.isDirectory() && !ContainsOutlawedPath(path)) {
                            values = values.concat(GetAllPaths(path, tier+1));
                            // values.splice(values.indexOf(path), 1);
                        }
                    } catch (error) {
                        if (DEBUG)
                            console.log(error)
                    }
                    resolve();
                })
            }));
    } catch {
        // Do nothing.
    }

    await Promise.allSettled(promises.concat(values));
    /*
    for (let i = 0; i < values.length; i++)
        if (typeof(values[i]) == Promise) {
            values = values.concat(await values[i].flat(Infinity))
            values.splice(i, 1);
        }
    */

    if (values == []) console.log(`Returning empty folder: ${subdir}`);
    return values;
}

let GlobalPaths = [], MDBacklinks = {};
async function BuildGlobalPaths() {
    GetAllPaths("./")
        // Flatten it a few times just for good measure. 
        .then(val => Promise.all(val.flat(Infinity)))
        .then(val => Promise.all(val.flat(Infinity)))
        .then(val => Promise.all(val.flat(Infinity)))
        .then(val => Promise.all(val.flat(Infinity)))
        .then(val => Promise.all(val.flat(Infinity)))
        .then(async val => {
            GlobalPaths = val.flat(Infinity).flat(Infinity);
            Promise.allSettled(GlobalPaths).then(async values => {
                GlobalPaths = values;
                await new Promise(res => setTimeout(res, 5000));
                
                for (let i = 0; i < 10; i++)
                    await FilterArray();

                console.log(`File presearch complete! Number of items: ${GlobalPaths.length}`);
                // Test search:
                // console.log(FindFile("Japanese"));
                console.log("Searching now active!");

                /* Save file listing to JSON. 
                fs.writeFile("./files.json", JSON.stringify(GlobalPaths), (err) => {
                    if (err) console.log(err);
                });
                */

                async function FilterArray() {
                    for (let i = 0; i < GlobalPaths.length; i++) {
                        if ((await GlobalPaths[i]).value != undefined) // Test if promise
                            GlobalPaths[i] = await GlobalPaths[i].value;
                        if (Array.isArray(await GlobalPaths[i])) { // Test if array
                            try {
                                GlobalPaths = GlobalPaths.concat(await GlobalPaths[i].flat(Infinity));
                                GlobalPaths.splice(i, 1);
                                i--;
                            } catch (e) {
                                /*
                                if (DEBUG) {
                                    console.log(e);
                                    console.log(GlobalPaths[i]);
                                }
                                */
                            }
                        }
                    }
                }

                // Also at this point, build the backlinks database.
                const ObsidianLinkRegex = new RegExp(/\[\[[^\]]*\]\]/g);
                let LinkSearchPromises = [];
                for (let i = 0; i < GlobalPaths.length; i++) {
                    try {
                        const path = await GlobalPaths[i];
                        if (typeof(path) == 'string' && path.includes("md")) {
                            const search = new Promise(res => {
                                fs.readFile(path, (err, data) => {
                                    if (err != null) {
                                        if (DEBUG)
                                            return console.log(err);
                                        else return;
                                    }
    
                                    data = data.toString();
                                    const matches = data.match(ObsidianLinkRegex);
                                    if (matches != null) {
                                        for (let j = 0; j < matches.length; j++) {
                                            if (matches[j] != undefined)
                                                matches[j] = matches[j].substring(2, matches[j].length - 2)
                                        }
            
                                        MDBacklinks[GlobalPaths[i]] = matches;
                                    }

                                    res();
                                })
                            })
                            LinkSearchPromises.push(search);
                        }
                    } catch (e) {
                        // Do nothing.
                        continue;
                    }
                }

                Promise.all(LinkSearchPromises).then(() => {
                    console.log(`Backlinks active! Length: ${Object.keys(MDBacklinks).length}`);
                })

                /* Write out Paths and Links.
                setTimeout(() => {
                    fs.writeFileSync("./Paths.json", JSON.stringify(GlobalPaths));
                    fs.writeFileSync("./Links.json", JSON.stringify(GlobalBacklinks));
                }, 2000);
                */
            });
        })
}
BuildGlobalPaths();


const getMime = (s) => {
    for (const p in mimeTypes) {
        if (s.endsWith(p)) return mimeTypes[p];
    }
    return getMime("txt");
}

// Dissallowed paths:
/*
./index.js
./git*
etc...
*/
const DisallowedPatterns = [/\/\.git/, /Hiragana_Teacher\/Users\/\d+\/user.json/]

/**
 * Checks if a path is okay to share.
 * @param {String} path The path to safety check.
 */
function PathIsSafe(path) {
    for (let i = 0; i < DisallowedPatterns.length; i++) {
        const Matches = path.match(DisallowedPatterns[i]);
        if (Matches != undefined) return false;
    }

    // Last check, if it's a .js file, look to see if it starts with a JSON object declaring a safety thing.
    if (path.includes(".js") && path.includes("/modules/")) {
        let data = String(GetFileFromCache(path));
        if (data.includes("{") && data.includes("}"))
            try {
                const json = JSON.parse(data.substring(0, data.indexOf("}") + 1));
                if (json.readable == false) return false;
            } catch (e) {
                // Nothing, continue and return true.
                if (e && DEBUG)
                    console.log(e);
            }
    }

    return true;
}

// Implement a simple cache for files, which should recieve more traffic than other files.
let File_Cache = [];
/**
 * Loads a file from the cache, or adds it to the cache if needed.
 * @param {String} url The path to read from, as relative to index.js
 * @returns {Buffer} The file
 */
function GetFileFromCache(url) {
    if (!DEBUG && File_Cache[url])
        return File_Cache[url]
    
    // Safe because this is only called by controlled code.
    File_Cache[url] = fs.readFileSync(url)
    console.log(`File committed to cache! ${url}`);
    return File_Cache[url];
}

// Returns the size of a file in Megabytes.
function GetFileSizeInMegabytes(url) {
    return fs.statSync(url).size / (1024*1024);
}

// Removes a JS object from the start of the string if it's there.
function RemovePrependedObject(string) {
    if (string.startsWith("{") && string.includes("}")) {
        string = string.substring(string.indexOf("}") + 1);
    }
    return string;
}

/**
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} res 
 * @returns {Promise<http.ServerResponse>}
 */
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


    // If this is an implied index.html request, forward the user to the actual page.
    if (req.url.indexOf(".") == -1 && !req.url.includes("&") && !req.url.endsWith("/")) 
    {
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
                // Compress with GZip
                let oldLength = buffer.length
                zlib.gzip(buffer, (err, buffer) => {
                    if (err) console.log(err);
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
        // Old Strigoi stuff.
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
                // Below line is safe because it's limited to /users/
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
                let script = RemovePrependedObject(GetFileFromCache(localURL).toString());

                // Run the eval as an async function.
                return eval(`async function f() {${script}} f();`)
            } else {
                res.statusCode = 404;
                res.setHeader("Content-Type", "text/plain");
                res.end("Module Not Found!");
            }
        } else {
            const PathSafe = PathIsSafe(localURL);
            // Generally try to read any given file (that's not a directory), throw 404 if it doesn't work.
            if (fs.existsSync(localURL) && !fs.lstatSync(localURL).isDirectory() && PathSafe) {
                try {
                    let mime = getMime(localURL);
                    res.setHeader("Content-Type", mime);

                    // Always set content size.
                    var stats = fs.statSync(localURL)
                    var fileSizeInBytes = stats.size;
                    res.setHeader("Content-Length", fileSizeInBytes)

                    // If this is an AI image file or YBN Note, tell the user's device to cache it; those images don't usually change very often.
                        // (Cache for 1 week.)
                    if ((mime.includes("image") && localURL.includes("AI")) || localURL.includes(".excalidraw.json")) 
                        res.setHeader("Cache-Control", "max-age=604800")

                    // Cache requests for index files. Alternatively, the line to cache files smaller than 10MB is below..
                        // || GetFileSizeInMegabytes(localURL) < 10
                    if (localURL.includes("index") || localURL.includes("favicon")) {
                        res.end(GetFileFromCache(localURL));
                    } else if (localURL.includes('.png') && args.compress) {
                        // If we're reading a png, use sharp to recode it.
                        if (DEBUG) console.log("PNG Compression Started!");
                        if (File_Cache[localURL] == undefined)
                            sharp(GetFileFromCache(localURL))
                                .png({ progressive: true, compressionLevel: 7 })
                                .toBuffer()
                                .then(v => {
                                    // Make a stream from the buffer in order to send it over time rather than all at once.
                                    const stream = Readable.from(v);
                                    stream.pipe(res);
                                    if (DEBUG)
                                        stream.on('close', () => {
                                            console.log("PNG Compression Complete!");
                                        });
                                    File_Cache[localURL] = v;
                                })
                        else res.end(File_Cache[localURL]);
                    } else if (args.compress) {
                        res.EndWithCompression(GetFileFromCache(localURL));
                    } else {
                        let s = fs.createReadStream(localURL);
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
                if (!PathSafe) {
                    res.setHeader("Content-Type", "text/plain");
                    res.statusCode = 401;
                    res.end("You are not authorized to read local URL: " + localURL);
                } else {
                    res.setHeader("Content-Type", "text/plain");
                    res.statusCode = 404;
                    res.end("Not found, Local URL: " + localURL);
                }
            }
        }

        // POSTING:
    } else if (req.method === "POST") {
        // Asynchronously download data.
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
                // The below code has been filtered so it's safe enough to have.
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
                        const file = RemovePrependedObject(GetFileFromCache(localURL).toString());
                        if (localURL.endsWith(".js")) {
                            eval(`async function f() {${file}} f();`);
                        } else {
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

//#region Add socket support to the server.
const { Server: SocketServer } = require("socket.io");
const { io: SocketClientIO, Socket } = require("socket.io-client");
const io = new SocketServer(server);

/**
 * @type {Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>[]}
 */
const IOsockets = [];

io.on("connection", (socket) => {
  if (DEBUG)
    console.log(`connect ${socket.id}`);

  IOsockets.push(socket);

  // Handle disconnection
  socket.on("disconnect", () => {
    const index = IOsockets.indexOf(socket);
    if (index !== -1) {
      IOsockets.splice(index, 1);
    }
  });

  socket.onAny((event, args) => {
    const thisEvent = `${event}|${JSON.stringify(args)}`;

    if (thisEvent !== lastEvent) {
      lastEvent = thisEvent;
      AIServerSocket.emit(event, args);
      socket.broadcast.emit(event, args); // Broadcast to other clients except sender
    }
  });
});

let lastEvent = "";
/**
 * @type {Socket}
 */
let AIServerSocket = TryMakeAIServerSocket();

function TryMakeAIServerSocket() {
    try {
        AIServerSocket = new SocketClientIO('http://localhost:7243', { reconnect: true });
        AIServerSocket.onAny((event, args) => {
            const thisEvent = `${event}|${JSON.stringify(args)}`;
          
            if (thisEvent !== lastEvent) {
              lastEvent = thisEvent;
              IOsockets.forEach(con => {
                con.emit(event, args); // Emit to all clients
              });
            }
          });
        
        // Add error handling for AIServerSocket
        AIServerSocket.on('connect_error', () => {
            console.error("Failed to connect to AI server!");
            /*setTimeout(() => {
                TryMakeAIServerSocket();
            }, 30000);*/
        });

        if (DEBUG) {
            AIServerSocket.on('connect', () => {
                console.log("Connected to AI server!");
            });
        }

        return AIServerSocket;
    } catch {
        // Try again 30 seconds down the line.
        setTimeout(() => {
            return AIServerSocket = TryMakeAIServerSocket();
        }, 30000);
    }
}
//#endregion

// Stolen from StackOverflow ;) 
    // And then Not-updated to use UTF-8.
// const utf8 = require('utf-8')

/**
 * @param {String} part
 */
function DecodeUTF8(part) {
    /* if (utf8.isNotUTF8()) { */ 
        return decodeURIComponent(part);
    /* } else {
        let bytes = [];
        for (let i = 0; i < part.length; i++) {
            bytes.push(utf8.getCharCode(part[i]));
        }

        return utf8.getStringFromBytes(bytes);
    } */ 
}

function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        try {
            var pair = pairs[i].split('=');
            query[decodeURIComponent(pair[0])] = DecodeUTF8(pair[1]);
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
module.exports = { global, GetFileFromCache, GetFileSizeInMegabytes, getMime, MDBacklinks, GlobalPaths }
// Run ESports setup stuff.
const esports = require("./Esports_Projects/Esports_Index.js")
// eval(fs.readFileSync("Esports_Projects/Esports_Index.js").toString());
// console.log(esports);
global.File_Cache = File_Cache;

// Run Hiragana Teacher stuff.
// require("./Hiragana_Teacher/Hiragana_Teacher_Index.js")
eval(fs.readFileSync('Hiragana_Teacher/Hiragana_Teacher_Index.js').toString());

// Run the AI Index stuff.
// require("./FTP/AI/AI_Index.js")
eval(fs.readFileSync("./FTP/AI/AI_Index.js").toString());;

const SaveGlobalAndExit = function (error = null) {
    if (error) console.log(error);

    delete global.File_Cache;
    fs.writeFileSync("./Global.json", JSON.stringify(global));
    process.exit();
};
// Save the global cache when the program is shut down, or on crash.
process.on('SIGINT', SaveGlobalAndExit);

// If we're not in debug mode, ignore all errors. 
if (!DEBUG) {
    process.on('uncaughtException', function (err) {
        console.log('Caught exception: ');
        console.log(err);
    });
} else {
    process.on('uncaughtException', SaveGlobalAndExit)
}