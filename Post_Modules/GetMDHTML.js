/**
 * Location: File path
 */

// Regexs
const ObsidianLinkRegex = new RegExp(/\[\[[^\]]*\]\]/g);
const TagRegex = new RegExp(/(?<!#)\B#{1}([A-Za-z0-9]{1,})/g);
const SingleLaTeX = new RegExp(/\$(.*?)\$/g);
const MultipleLaTeX = new RegExp(/\$\$(.*?)\$\$/g);

// console.log("+[[School Todo]]".match(ObsidianLinkRegex).length)

const fs = require('fs');
const path = require('path');
const Showdown = require('showdown');
const temml = require('temml');

let GivenData = JSON.parse(data);

console.log(GivenData.location);

if (GivenData.location != undefined && fs.existsSync(GivenData.location)) {
    // First, let's read in the file.
    // GivenData.location = DecodeLocation();
    /**
     * @type {String}
    */
    let file = String(GetFileFromCache(GivenData.location)); // .split("\n");
    console.log(typeof(file));

    const ObsidianLinks = file.match(ObsidianLinkRegex);

    // Replace obsidian links.
    if (ObsidianLinks != null)
        for (let i = 0; i < ObsidianLinks.length; i++) try {
            let link = ObsidianLinks[i];
            const inside = link.substring(2, link.length - 2); // Remove [[]]
            
            // Find the file.
            const Matches = FindFile(`${inside}`); // inside.includes(".") ? "" : ".md" // Include ".md" if no period found (assume file extension) 
            console.log(`{${Matches}}, with term \`${inside}\`, replacing ${link}`);
            let newLink = `https://micahb.dev/`;
            const URI = encodeURIComponent(Matches[0]); // Safe version of the link url. (In case of 日本語)
            if (Matches[0].includes(".md")) newLink += `Modules/GetMDHTML.js&location=${URI}`;
            else newLink += URI;
            
            // To prevent link weirdness, just manually put it into an <a> element or an <img> element if it's an image. 
            if (!newLink.includes(".png") && !newLink.includes(".jpg"))
                file = file.replaceAll(link, `<a href="${newLink}">${inside}</a>`);
            else 
                file = file.replaceAll('!' + link, `<img src="${newLink}">`)
        } catch { /* Do nothing. */ }

    // Replace tags.
    const tags = file.match(TagRegex);

    if (tags != null)
        for (let i = 0; i < tags.length; i++ ) {
            let tag = tags[i];
            const inside = tag.substring(1);
            file = file.replaceAll(tag, `{TAG:${inside}}`);
        }

    // Hand it over to Showdown for the actual conversion.
    const Converter = new Showdown.Converter();
    // Converter.setOption('tables', true);
    Converter.setFlavor('allOn');
    file = Converter.makeHtml(file);

    // Replace LaTex: (Do it after making HTML)
    const laTeX = file.match(SingleLaTeX); // .concat(file.match(MultipleLaTeX));
    if (laTeX != null) {
        for (let i = 0; i < laTeX.length; i++) {
            let replaced = laTeX[i];
            do {
                if (replaced.startsWith("$")) replaced = replaced.substring(1);
                if (replaced.endsWith("$")) replaced = replaced.substring(0, replaced.length - 1);
            } while (replaced.startsWith("$") || replaced.endsWith("$"))
            const mathML = temml.renderToString(replaced);

            if (mathML != "<math></math>")
                file = file.replaceAll(laTeX[i], mathML)
        }
    }

    res.statusCode = 200;
    // Just for good measure, make it decode in UTF-8.
    file = "<head><meta charset=\"UTF-8\"></head>\n" + file;
    res.setHeader("Content-Type", getMime("html"));
    res.end(file);
} else {
    res.statusCode = 404;
    res.setHeader("Content-Type", getMime("json"));
    let Response = {
        sucessful: false,
        reason: "Invalid file!",
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