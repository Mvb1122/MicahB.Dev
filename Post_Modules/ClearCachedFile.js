/*
params:
    path {String} The path to clear.
*/

let GivenData = JSON.parse(data);
const response = {
    successful: false
}
if (GivenData.path) {
    // Scan for backlinks
    const keys = Object.keys(File_Cache);
    if (keys.includes(GivenData.path)) {
        delete File_Cache[GivenData.path]
        response.successful = true;
        response.cleared_files = [GivenData.path]
    }
} else {
    response.successful = false;
    response.reason = "No path passed!";
}

res.statusCode = 200;
res.setHeader("Content-Type", getMime("json"));
res.end(JSON.stringify(response));