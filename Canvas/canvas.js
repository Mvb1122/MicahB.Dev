//#region Add draggable functions
function drag_start(event) {
    /**
     * @type {CSSStyleDeclaration}
     */
    var style = window.getComputedStyle(event.target, null);
    var str = (parseInt(style.getPropertyValue("left")) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top")) - event.clientY) + ',' + event.target.id;
    event.dataTransfer.setData("Text", str);

    // Make the element able to be clicked through.
    event.target.style.setProperty("pointerEvents", "none")

    // Show trash corner.
    document.getElementById("TrashCorner").hidden = false;
}

let last_z = 0;
function drop(event) {
    var offset = event.dataTransfer.getData("Text").split(',');
    var dm = document.getElementById(offset[2]);
    dm.style.left = (event.clientX + parseInt(offset[0], 10)) + 'px';
    dm.style.top = (event.clientY + parseInt(offset[1], 10)) + 'px';

    // Make it so whatever you moved last always goes on top.
    dm.style.zIndex = ++last_z;

    // Make it not able to be clicked through again
    dm.style.setProperty("pointerEvents", "inherit")
    
    // If we're above the trash corner, delete it.
    const trashCorner = document.getElementById("TrashCorner");
    if (DoElementsOverlap(dm, trashCorner)) {
        // If we're removing an AI node then disconnect the socket.
        let IsAINode = false;
        for (let i = 0; i < dm.children.length; i++) {
            const node = dm.children.item(i);
            if (node.id == "messages") {
                IsAINode = true;
                break;
            }
        }

        if (IsAINode) {
            Disconnect();
        }

        dm.parentElement.removeChild(dm);

        // Autosave too.
        QueueForAutoSaveToLocalStorage();
    }

    // Hide trash corner.
    trashCorner.hidden = true;

    // Save for autoreloading. 
    SaveToLocalStorage();

    // Resize the content div.
    RecalculateBodyBounds();

    event.preventDefault();
    return false;
}

function drag_over(event) {
    event.preventDefault();
    return false;
}
//#endregion

/**
 * @param {Document} element element to grab all elements under.
 * @returns {[HTMLElement]}
 */
function GetAllElements(element = document) {
    let elements = [];
    for (let i = 0; i < element.children.length; i++) if (element.children[i].children.length > 0) elements.push(GetAllElements(element.children[i]));
    elements.push(element.children)
    return elements.flat();
}

function EquipAllDraggable() {
    let Elements = document.querySelectorAll(".Nodule");

    for (let i = 0; i < Elements.length; i++) {
        const draggable = Elements[i];
        if (draggable.draggable) {
            EquipDraggable(draggable)
        }
    }
}

/**
 * @param {Element} draggable 
 */
function EquipDraggable(draggable) {
    // Things it needs: style="left: X; top: X;" an ID, and listeners.
    draggable.draggable = true;
    if (draggable.id == "") {
        // If it needs an ID, assign it an unused random one.
        let ID;
        do {
            ID = "Draggable_" + Math.floor(Math.random() * 10000);
        } while (document.getElementById(ID) != null)

        draggable.id = ID;
    }

    // Find where it is.
    if (draggable.style.left == "" || draggable.style.top == "") {
        const Location = draggable.getBoundingClientRect();

        draggable.style.left = Location.left + "px";
        draggable.style.top = Location.top + "px";
    }

    // Add listeners.
    draggable.addEventListener("dragstart", e => drag_start(e));
}

/**
 * @param {'text' || 'image' || 'url' || 'url_Pre'} type 
 */
function Add(type, url = "null") {
    /**
     * @type {HTMLElement}
     */
    let element;
    switch (type) {
        case 'text':
            element = document.createElement("textarea");
            element.style.height = "1em";
            element.style.width = "5em";

            // Save occasionally.
            element.addEventListener("change", () => {
                QueueForAutoSaveToLocalStorage();
            })
            break;
            
        case 'url_Pre':
            element = document.createElement("input");
            element.type = "text"
            element.style.height = "1em";
            element.style.width = "10em";
            element.placeholder = "Paste URL Here!"
            
            
            element.addEventListener("change", () => {
                element.hidden = true;
                Add('url', element.value);
            })
            break;

        case 'url': 
            element = document.createElement("iframe");
            element.style.height = "10em";
            element.style.width = "10em";
            element.style.resize = "both";
            element.style.position = "absolute";

            // Fix the URL if it's a YouTube link.
            var end = url.includes("&") ? url.indexOf("&") : url.length;
            if (url.includes("youtube.com/watch")) {
                url = url.substring(0, end).replace("watch?v=", "embed/")
            }
            else if (url.includes("youtu.be")) {
                url = `https://youtube.com/embed/${url.substring(url.indexOf("be/") + 3, end)}`;
            }
            else if (url.includes("pornhub.com"))
                url = url.replace("/view_video.php?viewkey=", "/embed/")
            else if (url.includes("archive.org"))
                url = url.replace("details", "embed")

            element.src = url;
            break;

        case 'img_Pre':
            element = document.createElement("input");
            element.type = "file";
            element.accept = "image/png, image/jpeg";

            element.addEventListener("change", () => {
                if (element.value) {
                    // Upload it and then add it as an image.
                    Upload(element).then(url => {
                        // Add the image.
                        Add('img', url);

                        // Remove the element.
                        element.parentElement.removeChild(element);
                    })
                }
            })
            break;

        case 'img':
            element = document.createElement("img");
            element.src = url;

            element.style.resize = "both"
            
            // Make it resizable.
            element.addEventListener("mouseenter", () => {
                element.style.resize = "both"
            });
            element.addEventListener("mouseleave", () => {
                element.style.resize = "none";
            })

            break;

        case 'ico_Pre':
            element = document.createElement('input');
            element.type = "text"
            element.style.height = "1em";
            element.style.width = "10em";
            element.placeholder = "Paste URL Here!"
            
            
            element.addEventListener("change", () => {
                Add('ico', element.value);
                element.parentElement.removeChild(element);
            })
            break;

        case 'ico':
            // Create the linking block:
            element = document.createElement('a');
            element.setAttribute("href", url);

            // Set the page's title asynchronously so that things run fastish.
            element.setAttribute("title", "Loading...");
            GetRemotePageTitle(url).then(val => {
                element.setAttribute("title", val);
            })

            // Make it open in a new tab.
            element.setAttribute("target", "_blank")
            element.setAttribute("rel", "noreferrer noopener")

            // Create the icon:
            var icon = document.createElement("img")
            icon.className = "Icon";
            icon.src = `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=256`;
            icon.draggable = false; // Parent is draggable so dw.

            element.appendChild(icon);
            break;
        
        case 'AI': 
            element = document.createElement("div");

            // Add a thing for the messages.
            var messagesDiv = document.createElement("div");
            messagesDiv.id = "messages";
            element.appendChild(messagesDiv);

            // Add a thing for text input.
            var BottomRowDiv = document.createElement("div");
            var TextInput = document.createElement("input");
            TextInput.type = "text";
            TextInput.id = "input";
            TextInput.autocomplete = false;
            
            var SendButton = document.createElement("button");
            SendButton.textContent = "📤";
            SendButton.title = "Send!";
            SendButton.setAttribute("onclick", "SendMessage()");
            
            var MuteButton = document.createElement("button");
            MuteButton.textContent = "🔇"
            MuteButton.title = "Mute/Unmute spoken AI. Also toggles user's microphone."
            MuteButton.setAttribute("onclick", "ToggleAIMute()");
            
            BottomRowDiv.appendChild(TextInput);
            BottomRowDiv.appendChild(SendButton);
            BottomRowDiv.appendChild(MuteButton);
            element.appendChild(BottomRowDiv);

            // Styling stuff.
            element.style.display = "flex";
            element.style.flexFlow = "column";
            element.style.justifyContent = "space-between";
            element.style.width = "15vw";
            element.style.height = "15vh";

            messagesDiv.style.width = "100%";
            messagesDiv.style.paddingBottom = "2%";
            messagesDiv.style.overflow = "overlay";
            TextInput.style.width = "78%";
            SendButton.style.width = "8%";
            MuteButton.style.width = "8%";

                // Set margin.
            [TextInput, SendButton, MuteButton].forEach(el => {
                el.style.margin = "0px";
            })
            TextInput.style.marginRight = "2%";

            // Get the AI to open up and stuff.
            StartWebsocket();

            // Add convenience enter = send key.
            AddChatEnterListenerToMessages(TextInput);
            
            break;

        default:
            element = document.createElement("div");
    }

    // Put it on screen, in the center, on top.
    document.getElementById("content").append(element);
    element.className = "Nodule";
    element.style.zIndex = ++last_z;
    element.style.left = "50vw";
    element.style.top = "50vh";
    EquipDraggable(element);
    SaveToLocalStorage();

    return element;
}

function AddChatEnterListenerToMessages(el) {
    // Ensure that the element passed is valid or return after trying.
    if (el == null) {
        el = document.getElementById("input");

        if (el == null) return;
    }

    el.addEventListener("keydown", function (e) {
        if (e.code === "Enter") {  // Checks whether the pressed key is "Enter"
            SendMessage();
        }
    });
}

/**
 * 
 * @param {HTMLInputElement} selector 
 */
async function Upload(selector) {
    return new Promise(res => {
        // Prepare the request
        let data = selector.files[0];
        const actualData = data.arrayBuffer();
        let name = `../Canvas/@Res/${data.name}`;
        var url = "../FTP/Post_Modules/Upload.js&target=" + name;

        var xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", data.type);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                console.log(xhr.status);
                console.log(xhr.responseText);
                let JSONData = JSON.parse(xhr.responseText);

                if (JSONData.upload != null) {
                    let response = `${JSONData.upload}`.split("/");
                    res(`./@Res/${response[response.length - 1]}`);
                } else {
                    alert(JSONData.reason)
                }
            }
        };

        // Read and send the file.
        actualData.then(d => {
            xhr.send(d);
        })
    })
}

function GetDocumentTitle() {
    return `${document.getElementsByClassName("Title")[0].innerText}`.trim();
}

async function Save() {
    try {
        // create a new handle
        let SaveHandle = await window.showSaveFilePicker(
            { "suggestedName": GetDocumentTitle(), "types": [{ "description": "Text File", "accept": {"text/plain": [".txt"]} }, { "description": "HTML File", "accept": {"text/html": [".html"]} }] }
        );
        
        // create a FileSystemWritableFileStream to write to
        const writableStream = await SaveHandle.createWritable();
        
        // Copy all textarea content into its innerhtml.
        const areas = document.getElementsByTagName("textarea");
        for (let i = 0; i < areas.length; i++) areas[i].innerHTML = areas[i].value;
        
        // write our file
        const content = document.getElementById("content").innerHTML;
        await writableStream.write(content);

        // close the file and write the contents to disk.
        await writableStream.close();
    } catch (err) {
        console.error(err.name, err.message);
    }
}

async function Load() {
    const input = document.createElement('input');
    input.type = 'file';

    input.addEventListener("change", async () => {
        const enc = new TextDecoder("utf-8");

        const data = input.files[0].arrayBuffer();
        const text = enc.decode(await data);
        LoadContent(text);
    })

    input.click();
}

function LoadContent(text) {
    document.getElementById("content").innerHTML = text;
    EquipAllDraggable();

    // Copy all textarea content into its value, also make it have autosave.
    const attachAutosave = (element) => {
        element.addEventListener("input", () => QueueForAutoSaveToLocalStorage());
        element.addEventListener("change", () => QueueForAutoSaveToLocalStorage());
    };
    const areas = document.getElementsByTagName("textarea");
    for (let i = 0; i < areas.length; i++) {
        areas[i].value = areas[i].innerHTML;
        attachAutosave(areas[i], "change");
    }

    // Find highest z-index.
    const zIndexes = text.match(/(?<=z-index: )\d+/g);
    let max = -100;
    if (zIndexes) {
        for (let i = 0; i < zIndexes.length; i++) {
            if (Number.parseInt(zIndexes[i]) > max) max = zIndexes[i];
        }
        last_z = max;
    } else last_z = 0;

    // Make sure title is editable and causes autosave.
    const title = document.getElementsByClassName("Title")[0];
    title.setAttribute("contenteditable", "true");
    attachAutosave(title);

    // Make sure textarea causes autosave.
    for (let i = 0; i < areas.length; i++) attachAutosave(areas[i]);

    // Add that text input listener to any AI nodes.
    AddChatEnterListenerToMessages();
}

function DoElementsOverlap(Element1, Element2) {
    const rect1 = Element1.getBoundingClientRect();
    const rect2 = Element2.getBoundingClientRect();

    return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
}

async function GetRemotePageTitle(url) {
    // Thanks AllOrgins for this handy trick :)
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const title = doc.querySelectorAll('title')[0];
    return title.innerText;
}

// Handle reloading last stuff when you load the page.
const AutoSaveLabel = "CanvasLastContent"

function PrepAndGetContent() {
    // Copy all textarea content into its innerhtml.
    const areas = document.getElementsByTagName("textarea");
    for (let i = 0; i < areas.length; i++) areas[i].innerHTML = areas[i].value;

    // Send back the content.
    return document.getElementById("content").innerHTML;
}

function SaveToLocalStorage() {
    localStorage.setItem(AutoSaveLabel, PrepAndGetContent());

    // Save to recents too.
    SaveToRecents();
}

function LoadFromLocalStorage() {
    if (localStorage.getItem(AutoSaveLabel) != null) {
        LoadContent(localStorage.getItem(AutoSaveLabel));
    }
}

// Roll up requests for autosaving into splurts every five seconds.
    // On documents with a lot of text boxes, this should make typing a lot more performant.
let SaveQueued = false;
function QueueForAutoSaveToLocalStorage() {
    if (SaveQueued) return;
    else {
        SaveQueued = true;
        setTimeout(() => {
            SaveToLocalStorage();
            SaveQueued = false;
            console.log("Autosaving!");
        }, 5000);
    }
}

const CanvasRecentsName = "CanvasRecents"; // [{name: string, content: string}]

function LoadFromRecent(name) {
    /** @type {[{name: string, content: string}]} */
    const recents = JSON.parse(localStorage.getItem(CanvasRecentsName));
    if (recents != undefined) {
        // Find recent file.
        for (let i = 0; i < recents.length; i++) 
            if (recents[i].name == name) {
                LoadContent(recents[i].content);
                break;
            }
    }
}

/// Does not throw if name is not in recents!
function RemoveFromRecent(name) {
    /** @type {[{name: string, content: string}]} */
    const recents = JSON.parse(localStorage.getItem(CanvasRecentsName));
    if (recents != undefined) {
        // Find recent file.
        for (let i = 0; i < recents.length; i++) 
            if (recents[i].name == name) {
                // Remove it.
                recents.splice(i, 1);

                // Save.
                localStorage.setItem(CanvasRecentsName, JSON.stringify(recents));
                break;
            }
    }
}

// Shows recent canvases.
function ViewRecents() {
    document.getElementById("RecentsOuter").hidden = false;
    
    if (localStorage.getItem(CanvasRecentsName) != null) {
        // Add recents.
        /** @type {[{name: string, content: string}]} */
        const recents = JSON.parse(localStorage.getItem(CanvasRecentsName));
        const list = document.createElement("table");

        recents.forEach(recentDoc => {
            const div = document.createElement("tr");
            const text = document.createElement("td");
            text.innerText = recentDoc.name;
            div.appendChild(text);
            
            const CreateButtonWithTextAndFunction = (text, f) => {
                const btn = document.createElement("button");
                btn.innerText = text;
                btn.onclick = f;
                const btntd = document.createElement("td");
                btntd.appendChild(btn);

                div.appendChild(btntd);
            }
            
            // Add a button which clicking loads the thing.
            CreateButtonWithTextAndFunction("Load", () => {LoadFromRecent(recentDoc.name);})

            // Add a button which removes it.
            CreateButtonWithTextAndFunction("🗑️", () => {
                // If we delete something, we should probably reload the list right after.
                RemoveFromRecent(recentDoc.name);
                ViewRecents();
            })

            // Add it to the table.
            list.appendChild(div);
        });
        
        // Add the table to the div.
        document.getElementById("RecentsList").innerText = "";
        document.getElementById("RecentsList").appendChild(list);
    } else {
        // Say they have no recents.
        document.getElementById("RecentsList").innerText = "You have no recents! Go make stuff! (Remember to change title!)"
    }
}

function HideRecents() {
    document.getElementById("RecentsOuter").hidden = true;
}

function SaveToRecents() {
    const title = GetDocumentTitle();
    
    // Remove old recent.
    RemoveFromRecent(title);

    let OldRecents = localStorage.getItem(CanvasRecentsName);
    if (OldRecents == undefined) OldRecents = [];
    else OldRecents = JSON.parse(OldRecents);


    // Save to the old recents and write it back down.
    const data = {
        name: title,
        content: PrepAndGetContent()
    };
    OldRecents.push(data);

    localStorage.setItem(CanvasRecentsName, JSON.stringify(OldRecents));
}

/**
 * Gets the maximum width and height of an element with children.
 * @param {HTMLElement} element What to scan.
 * @returns {DOMRect[]}
 */
function GetBoundsOfAllIncludingChildren(element) {
    let bounds = [element.getBoundingClientRect()];
    const children = element.children;
    for (let i = 0; i < children.length; i++) {
        const child = children.item(i);
        bounds.push(child.getBoundingClientRect());

        // Process all children. 
        bounds = bounds.concat(GetBoundsOfAllIncludingChildren(child));
    }

    return bounds;
}

function RecalculateBodyBounds() {
    // Get a list of all elements underneath the body, then use their bounds to change how large the body should be.
    const body = document.getElementsByTagName("body")[0]; // document.getElementById("content");
    const bodyBound = body.getBoundingClientRect();
    const AllBounds = GetBoundsOfAllIncludingChildren(body);
    let maxHeight, maxWidth = maxHeight = 0;
    for (let i = 0; i < AllBounds.length; i++) {
        const bound = AllBounds[i]
        // Ignore 100% scale items.
        if (bound.width == bodyBound.width || bound.height == bodyBound.height) continue;

        if (bound.bottom > maxHeight) maxHeight = bound.bottom;
        if (bound.right > maxWidth) maxWidth = bound.right;
    }

    // Apply the sizes to the body.
        // If this is less than the screen size, then just use the screen size.
    maxWidth = Math.max(window.visualViewport.width, maxWidth);
    maxHeight = Math.max(window.visualViewport.height, maxHeight);
    
    // Remove bumping from root element.
    maxWidth -= bodyBound.x;
    maxHeight -= bodyBound.y;
    SetBodyWidthHeight(maxWidth, maxHeight);
}

function SetBodyWidthHeight(maxWidth, maxHeight) {
    document.getElementsByTagName("body")[0].style.width = maxWidth + "px";
    document.getElementsByTagName("body")[0].style.height = maxHeight + "px";
}

/* Function stolen from WebAI files in GPT-3 Bot. */
/**
 * Writes text onto an HTML element over time.
 * @param {string} text Text to write on.
 * @param {HTMLElement | string} element Element to write onto or ID.
 * @param {boolean} [append=true] Whether to add to current text.
 * @param {number} [timeout=100] How long to wait in MS between letters.
 * @returns {Promise} Resolves when write on is complete.
 */
function WriteOn(text, element, append = true, timeout = 15) {
    return new Promise(async res => {
        if (typeof element == String)
            element = document.getElementById(element)
    
        let beforeContent = append ? element.innerText : "";
        for (let i = 0; i < text.length; i++) {
            beforeContent += text.charAt(i);
            element.innerText = beforeContent;
            
            // Scroll all the way down.
            element.scrollTo(0, element.scrollHeight)
            await new Promise(r2 => {
                setTimeout(() => {
                    r2();
                }, timeout);
            });
        }
        res();
    })
}