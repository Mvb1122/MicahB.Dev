/*
Note: This only works within the Markdown folder.

params:
    path {String} The path or search term to look for.
*/

let GivenData = JSON.parse(data);
const response = {
    successful: true
}
if (GivenData.path) {
    // Scan for backlinks
    let backlinks = [];
    linkLoop:
    for (let i = 0; i < Object.keys(MDBacklinks).length; i++) {
        const File = Object.keys(MDBacklinks)[i];
        const FileLinks = MDBacklinks[File];

        for (let j = 0; j < FileLinks.length; j++) {
            try {
                if (FileLinks[j].includes(GivenData.path)) {
                    backlinks.push(File);
                    continue linkLoop;
                }
            } catch {
                // Do nothing.
            }
        }
    }
    response.links = backlinks;
} else {
    response.successful = false;
    response.reason = "No backlinks found!";
}

res.end(JSON.stringify(response));