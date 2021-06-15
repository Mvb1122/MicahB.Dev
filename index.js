const fs = require('fs');
const http = require('http');
const host = require('os').hostname();;
const port = 80;

const requestListener = function (req, res) {
    console.log("\n\nRequest Recieved: " + req.url);
    console.log(req.method);
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
        } else if (req.url.endsWith("/")) {
            res.setHeader("Content-Type", "text/html");
            res.writeHead(200);
            let output = fs.readFileSync("index.html");
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
            
        }

        // POSTING:
    } else if (req.method === "POST") {
        // console.log(req.body);
        res.setHeader("Content-Type", "text/plain");
        res.writeHead(200);

        let data = "";

        req.on('data', chunk => {
            data += chunk;
        });
    
        req.on('end', () => {
            inputURL = req.url.replace("/json/", "/mDB/");

            // Ensure that path to write to exists:
            let inputPath = "./";
            let inputArr = inputURL.split("/");
            for (let i = 0; i < inputArr.length - 2; i++) {
                inputPath += inputArr[i + 1] + "/";
            }
            console.log(inputPath);
            fs.mkdirSync(inputPath);
            
            // Write data:
            fs.writeFile(`./${inputURL}`, data, (e) => {res.end("Complete: " + data + "\nURL: " + req.url + "\n Error: " + e);});
            console.log(data);
        })

        // res.end("Complete, " + req.toString());
    }
    

    // Post Stuff
    
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});