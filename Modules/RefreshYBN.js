console.log("Reloading YBN Notebooks!");


// Return format:
const response = {
    "Notes": [],
    "New": [],
    "successful": true
};

// Get a list of the notebooks.
const fs = require('fs');
const YBNPath = "YBN_Notebooks/";
fs.readdirSync(YBNPath).forEach(folder => {
    if (folder.startsWith("{") && folder.endsWith("}") || folder == "Default") {
        // This is a note folder, so add it to the list. (and also make the path.)
        response.Notes.push(folder);
        let path = YBNPath + folder;

        // Make a folder for it in the Converted_YBN_Notebooks
        fs.mkdir("Converted_" + path, () => {
            // Dir is created.
            if (DEBUG)
                console.log(`MKDIR@RefreshYBN.js: ${"Converted_" + path}`);

            response.New.push(folder);
        })

        // Get a list of the pages.
        fs.readdir("./" + path, (err, pages) => {
            // Write the page listing to the directory.
                // Remove .png's
            pages.forEach(page => {
                if (page.includes(".png")) 
                    pages.splice(pages.indexOf(page), 1)
            })

            const PGData = {
                pages: pages
            };
            fs.writeFile(`Converted_${path}/pages.json`, JSON.stringify(PGData), (err) => {
                if (err) console.log(err);
            });

            // Now, for each page, load the JIIX-format drawing information.
            let ReadPromises = [];
            pages.forEach(page => {
                ReadPromises.push(new Promise((resolve) => {
                    const DrawingPath = `./${path}/${page}/Drawing.jiix`;
                    fs.readFile(DrawingPath, (err, data) => {
                        try {
                            const YBN = JSON.parse(data);
                            
                            // Convert it into Excalidraw format.
                            const Excalidraw = {
                                "type": "excalidraw",
                                "version": 2,
                                "source": "https://micahb.dev",
                                "elements": [],
                                "appState": {
                                    "gridSize": null,
                                    "viewBackgroundColor": "#ffffff"
                                },
                                "files": {}
                            };
        
                            const pageX = YBN["bounding-box"].x;
                            const pageY = YBN["bounding-box"].y;
                            const pageWidth = YBN["bounding-box"].width;
                            const pageHeight = YBN["bounding-box"].height;
        
                            YBN.items.forEach(item => {
                                // Calculate width and height, while also rebasing deltas. 
                                let Width = -100;
                                const RootX = item.X[0];
                                const XCoords = [];
                                item.X.forEach(coord => {
                                    const delta = Math.abs(coord);
                                    if (delta > Width)
                                        Width = delta;
        
                                    XCoords.push(coord - RootX);
                                })
        
                                let Height = -100;
                                const RootY = item.Y[0];
                                const YCoords = [];
                                item.Y.forEach(coord => {
                                    const delta = Math.abs(coord);
                                    if (delta > Height)
                                        Height = delta;
        
                                    YCoords.push(coord - RootY); 
                                })
        
                                const Seed = Math.floor(Math.random() * 1000000000);
                                let TimeStampEnd = item.timestamp;
                                TimeStampEnd = TimeStampEnd.substring(TimeStampEnd.indexOf(".") + 1);
                                const eItem = {
                                    "id": Seed,
                                    "type": "freedraw",
                                    "x": RootX * 10,
                                    "y": RootY * 10,
                                    "width": Width,
                                    "height": Height,
                                    "angle": 0,
                                    "strokeColor": "#1e1e1e",
                                    "backgroundColor": "transparent",
                                    "fillStyle": "solid",
                                    "strokeWidth": 1, // TODO: Find out how to pull out the stroke width.
                                    "strokeStyle": "solid",
                                    "roughness": 1,
                                    "opacity": 100,
                                    "groupIds": [],
                                    "frameId": null,
                                    "roundness": null,
                                    "seed": Seed,
                                    "version": 22,
                                    "versionNonce": 847882817,
                                    "isDeleted": false,
                                    "boundElements": null,
                                    "updated": TimeStampEnd,
                                    "link": null,
                                    "locked": false,
                                    "points": [],
                                    "pressures": [],
                                    "simulatePressure": true,
                                    "lastCommittedPoint": null
                                }
        
                                // Add points and pressures.
                                for (let i = 0; i < XCoords.length; i++) {
                                    eItem.points.push([XCoords[i] * 10, YCoords[i] * 10 ]);
                                    eItem.pressures.push(item.F[i]);
                                }
        
                                // Add last point.
                                // eItem.lastCommittedPoint = eItem.points[eItem.points.length];
        
                                // Add it to the overall file.
                                Excalidraw.elements.push(eItem);
                            })
    
                            // Write out the page.
                            fs.writeFile(`Converted_${path}/${page}.excalidraw.json`, JSON.stringify(Excalidraw), (err) => {
                                if (err)
                                    console.log(err);
                            })
                            resolve();
                        } catch (e) { 
                            // Do nothing except log since it meant the file was weird or whatever.
                            console.log(`Error processing file ${DrawingPath}!`);
                            console.log(e); 
                        } 
                    })
                }))
            })

            Promise.all(ReadPromises).then((v) => {
                if (DEBUG) console.log(`Notebook written! ${path}`);
            })
        })
    }
});

res.statusCode = 200;
res.setHeader("Content-Type", getMime("json"));
res.end(JSON.stringify(response));