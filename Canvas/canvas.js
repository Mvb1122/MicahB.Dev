// Add draggable functions
function drag_start(event) {
    var style = window.getComputedStyle(event.target, null);
    var str = (parseInt(style.getPropertyValue("left")) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top")) - event.clientY) + ',' + event.target.id;
    event.dataTransfer.setData("Text", str);

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
    
    // If we're above the trash corner, delete it.
    const trashCorner = document.getElementById("TrashCorner");
    if (DoElementsOverlap(dm, trashCorner)) {
        dm.parentElement.removeChild(dm);
    }

    // Hide trash corner.
    trashCorner.hidden = true;

    // Save for autoreloading. 
    SaveToLocalStorage();

    event.preventDefault();
    return false;
}

function drag_over(event) {
    event.preventDefault();
    return false;
}

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
            const icon = document.createElement("img")
            icon.className = "Icon";
            icon.src = `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=256`;
            icon.draggable = false; // Parent is draggable so dw.

            element.appendChild(icon);
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
}

/**
 * 
 * @param {HTMLInputElement} selector 
 */
async function Upload(selector) {
    return new Promise(async res => {
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
        xhr.send(await actualData);
    })
}

async function Save() {
    try {
        // create a new handle
        let SaveHandle = await window.showSaveFilePicker();
        
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

    // Copy all textarea content into its value.
    const areas = document.getElementsByTagName("textarea");
    for (let i = 0; i < areas.length; i++) areas[i].value = areas[i].innerHTML;

    // Find highest z-index.
    const zIndexes = text.match(/(?<=z\-index: )\d?\d/g);
    let max = -100;
    for (let i = 0; i < zIndexes.length; i++) {
        if (Number.parseInt(zIndexes[i]) > max) max = zIndexes[i];
    }
    last_z = max;
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
};


// Handle reloading last stuff when you load the page.
const AutoSaveLabel = "CanvasLastContent"

function SaveToLocalStorage() {
    // Copy all textarea content into its innerhtml.
    const areas = document.getElementsByTagName("textarea");
    for (let i = 0; i < areas.length; i++) areas[i].innerHTML = areas[i].value;

    localStorage.setItem(AutoSaveLabel, document.getElementById("content").innerHTML);
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
        }, 5000);
    }
}