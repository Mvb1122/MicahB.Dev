/**
 * args: Location 
 */

// Regexs
const ObsidianLinkRegex = new RegExp(/\[\[[^\]]*\]\]/g);
const TagRegex = new RegExp(/(?<!#)\B#{1}([A-Za-z0-9]{1,})/g)

const fs = require('fs');
const path = require('path');
const Showdown = require('showdown');


args.location = unescape(args.location.trim("\""));
if (args.location != undefined && fs.existsSync(args.location)) {
    // First, let's read in the file.
    /**
     * @type {String}
    */
    let file = GetFileFromCache("./" + args.location).toString(); // .split("\n");

    const ObsidianLinks = file.match(ObsidianLinkRegex);
    // Replace obsidian links.
    for (let i = 0; i < ObsidianLinks.length; i++) try {
        let link = ObsidianLinks[i];
        const inside = link.substring(2, link.length - 2);
        
        // Find the file.
        const Matches = FindFile(inside);
        console.log(`{${Matches}}, with term ${inside}, replacing ${link}`);
        let newLink = `https://micahb.dev/`;
        if (Matches[0].includes(".md")) newLink += `Modules/GetMDHTML.js&location=${Matches[0]}`;
        else newLink += Matches[0];
        
        file = file.replaceAll(link, `[${inside}](${newLink})`);
    } catch { ; } // Do nothing.

    // Replace tags.
    const tags = file.match(TagRegex);
    for (let i = 0; i < tags.length; i++ ) {
        let tag = tags[i];
        const inside = tag.substring(1);
        file = file.replaceAll(tag, `{TAG:${inside}}`);
    }

    // Hand it over to Showdown for the actual conversion.
    const Converter = new Showdown.Converter();
    file = Converter.makeHtml(file);

    res.statusCode = 200;
    res.setHeader("Content-Type", getMime("html"));
    res.end(file);
} else {
    res.statusCode = 404;
    res.setHeader("Content-Type", getMime("json"));
    res.end(JSON.stringify({
        sucessful: false,
        reason: "Invalid file!"
    }));
}