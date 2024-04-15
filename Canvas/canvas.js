// Add draggable functions
function drag_start(event) {
    var style = window.getComputedStyle(event.target, null);
    var str = (parseInt(style.getPropertyValue("left")) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top")) - event.clientY) + ',' + event.target.id;
    event.dataTransfer.setData("Text", str);
}

function drop(event) {
    var offset = event.dataTransfer.getData("Text").split(',');
    var dm = document.getElementById(offset[2]);
    dm.style.left = (event.clientX + parseInt(offset[0], 10)) + 'px';
    dm.style.top = (event.clientY + parseInt(offset[1], 10)) + 'px';
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