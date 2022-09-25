const fs = require('fs');

// Remove header stuff and write.
// console.log(data.includes("WebKitFormBoundary"))
if (data.includes("WebKitFormBoundary")) {
    data = data.substring(data.indexOf(`Content-Type`), data.lastIndexOf("------"));
    data = data.substring(data.indexOf("\n")).trim().replace("\\n", "\\\n");
}

let location = `FTP/${unescape(args.target.replace("$$DOT$$", "."))}`;
fs.writeFileSync(location, data);

res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
res.end(JSON.stringify({ upload: location }));