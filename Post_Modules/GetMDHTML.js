/**
 * Location: File path
 */

// Regexs
const ObsidianLinkRegex = new RegExp(/(?<=)\!?\[\[[^\]]*\]\]/g);
const TagRegex = new RegExp(/(?<!#)\B#{1}([A-Za-z0-9]{1,})/g);
const laTexReGex = new RegExp(/(\$(.{1,}?)\$)|(\${2}(\n|\r)([\s\S]*?)(\n|\r)\${2})/gm);

// console.log("+[[School Todo]]".match(ObsidianLinkRegex).length)

const fs = require('fs');
const Showdown = require('showdown');
const temml = require('temml');
const highlightjs = require('highlight.js');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

let GivenData = JSON.parse(data);


const safe = PathIsSafe(GivenData.location);
if (GivenData.location != undefined && fs.existsSync(GivenData.location) && safe) {
    // First, let's read in the file.
    // GivenData.location = DecodeLocation();
    /**
     * @type {String}
    */
    let file = String(GetFileFromCache(GivenData.location)); // .split("\n");
    const IsExcalidraw = GivenData.location.endsWith(".excalidraw.md");

    if (!IsExcalidraw) {
        // Replace obsidian links.
        const ObsidianLinks = file.match(ObsidianLinkRegex);
        if (ObsidianLinks != null)
            for (let i = 0; i < ObsidianLinks.length; i++) try {
                let link = ObsidianLinks[i];

                let IsEmbedLink = false;
                if (link.startsWith("!")) {
                    IsEmbedLink = true;

                    // Remove the ! from both file and link.
                    file = file.replaceAll(link, link = link.substring(1));
                }

                let inside = link.substring(2, link.length - 2); // Remove [[]]
                let search = false;
                let Matches;

                // Cut off any heading 
                if (inside.includes("#")) {
                    // Find the file.
                    search = inside.substring(inside.indexOf("#") + 1).trim();
                    if (search.includes("ShowTitle")) {
                        search = search.replace("ShowTitle", "").trim();
                        inside = inside.substring(0, inside.indexOf("#")).trim();
                        Matches = FindFile(`${inside}`); // inside.includes(".") ? "" : ".md" // Include ".md" if no period found (assume file extension)
                        inside = search;
                    } else {
                        inside = inside.substring(0, inside.indexOf("#")).trim();
                        Matches = FindFile(`${inside}`); // inside.includes(".") ? "" : ".md" // Include ".md" if no period found (assume file extension)
                    }
                } else {
                    Matches = FindFile(`${inside}`); 
                }
                
                if (DEBUG)
                    console.log(`{${Matches}}, with term \`${inside}\`, replacing ${link}`);

                let newLink = `https://micahb.dev/`;

                const URI = encodeURIComponent(Matches[0]); // Safe version of the link url. (In case of 日本語)
                if (Matches[0].includes(".md")) newLink += `Modules/GetMDHTML.js&location=${URI}`;
                else newLink += URI;

                // To prevent link weirdness, just manually put it into an <a> element or an <img> element if it's an image. 
                if (!newLink.includes(".png") && !newLink.includes(".jpg")) {
                    const finalLink = `<a href="${newLink}" ${(IsEmbedLink ? `embed=${IsEmbedLink}` : "")} ${(search != false ? `search="${search}"` : "")}>${inside}</a>`;
                    file = file.replaceAll(link, finalLink);
                }
                else {
                    file = file.replaceAll('!' + link, `<img src="${newLink}">`)
                }
            } catch { /* Do nothing. */ }

        // Replace tags.
        const tags = file.match(TagRegex);

        if (tags != null)
            for (let i = 0; i < tags.length; i++) {
                let tag = tags[i];
                const inside = tag.substring(1);
                file = file.replaceAll(tag, `{TAG:${inside}}`);
            }

        // Replace LaTex: (Do it after making HTML)
        const laTeX = file.match(laTexReGex); // .concat(file.match(MultipleLaTeX));
        if (laTeX != null) {
            for (let i = 0; i < laTeX.length; i++) {
                let replaced = laTeX[i];
                do {
                    if (replaced.startsWith("$")) replaced = replaced.substring(1);
                    if (replaced.endsWith("$")) replaced = replaced.substring(0, replaced.length - 1);
                } while (replaced.startsWith("$") || replaced.endsWith("$"));
                
                replaced = replaced.trim();

                const mathML = temml.renderToString(replaced, {
                    displayMode: laTeX[i].includes('\n') // Turn on displaymode for multiline expressions.
                });

                if (mathML != "<math></math>")
                    file = file.replaceAll(laTeX[i], mathML)
            }
        }

        // Hand it over to Showdown for the actual conversion.
        const Converter = new Showdown.Converter();
        // Converter.setOption('tables', true);
        Converter.setFlavor('allOn');
        file = Converter.makeHtml(file);

        // Highlight code.
            // Instead of using regex, use worse string manip. methods in order to handle this.
            // Regex: /<code class=".*">(.*\n*)+<\/code>/gm
            // ^ Causes catostrophic backtracking on long files :(
            // NOTE: this implementation assumes that there's no nested code statements.
            // NOTE: this implementation assumes that all code blocks are closed.

        let start, end = start = 0, sectionToEnd = file;
        const startFlag = "<code", endFlag = "</code>";
        try {
            while (sectionToEnd.includes(startFlag)) {
                start = sectionToEnd.indexOf(startFlag);
                end = sectionToEnd.indexOf(endFlag) + endFlag.length;
                let section = sectionToEnd.substring(start, end);
                // Move sectionToEnd forward.
                sectionToEnd = sectionToEnd.substring(end);
                
                // Get section inner text. 
                const inner = new JSDOM(section);
                section = inner.window.document.querySelector("code").textContent;

                // Try to highlight them.
                const highlightedCode = highlightjs.highlightAuto(section).value;
                file = file.replace(section, highlightedCode); // .substring(startFlag.length + 1, -endFlag.length)

            }
        } catch (e) {
            if (DEBUG) { 
                console.log(`Error in file ${GivenData.location}! Invalid code block.`)
                console.log(e);
            }
        }

        res.statusCode = 200;
        // Just for good measure, make it decode in UTF-8.
        file = "<head><meta charset=\"UTF-8\"></head>\n" + file;
        res.setHeader("Content-Type", getMime("html"));
        return res.end(file);
    } else {
        /*
        const Excalidraw = require('excalidraw-to-svg');

        // Polyfill in Path2D
        const { CanvasRenderingContext2D } = require('canvas')
        const { polyfillPath2D } = require("path2d-polyfill")
        global.CanvasRenderingContext2D = CanvasRenderingContext2D;
        polyfillPath2D(global);
        */

        // Parse out the json from the file.
        if (file.includes("```json\n"))
            file = file.substring(file.indexOf("```json\n") + 7, file.lastIndexOf("```"));
        /*
        file = JSON.parse(file);

        // Convert it
        const diagramSvg = await Excalidraw(file);
        file = diagramSvg.outerHTML;
        */

        res.setHeader("Content-Type", getMime("json"));
        res.end(file);
    }
} else {
    res.statusCode = 404;
    res.setHeader("Content-Type", getMime("json"));
    let Response = {
        sucessful: false,
        reason: safe ? "Unable to read!" : "Invalid file!",
        location: GivenData.location ? GivenData.location : undefined
    }

    res.end(JSON.stringify(Response));
}

/*
function DecodeLocation() {
    console.log(GivenData.location);
    const location = decodeURIComponent(GivenData.location.trim("\"").trim("'"));
    GivenData.location = location;
    console.log(location);
    return location;
}
*/