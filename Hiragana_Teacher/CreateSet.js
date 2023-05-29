let rows = {}, SetCreationMode = "Create";
rows["line_0"] = document.getElementById("line_0");
let template_innerHTML = document.getElementById("line_0").innerHTML;
console.log("Set Creation Loaded!")

let EditSetID = -1;

function Add_Line() {
    // Figure out what row number this is, by incrementing the number at the end of the last one's ID.
    let name = Object.keys(rows);
    name = name[name.length - 1].split("_");
    let rowNum = Number.parseInt(name[1]) + 1;
    name = name[0] + "_" + (rowNum);

    // Setup the template for usage.
    // Create a template for each row.
    let template = document.createElement("tr");
    template.innerHTML = template_innerHTML.replaceAll("0", rowNum);
    template.id = name;

    // Append the template to all the places it needs to be.
    rows[template.id] = template;
    template.parentNode = document.getElementById("Links");
    document.getElementById("Links").appendChild(template)

    return name;
}

function ClearRows() {
    // Go through each row and remove it.
    for (let row in rows) {
        let rowNum = row.substring(row.indexOf("_") + 1);
        document.getElementById(`remove_${rowNum}`).onclick();
    }
}

// Creats a line and sets its value.
function Add_Line_With_Values(object, answer) {
    let lineNum = Add_Line();
    lineNum = lineNum.substring(lineNum.indexOf('_') + 1)

    document.getElementById(`input_${lineNum}`).value = object;
    document.getElementById(`answer_${lineNum}`).value = answer;
}

function Remove_Line(line) {
    // If this is the only row, wipe its inputs, otherwise, just delete it.
    if (Object.keys(rows).length == 1) {
        let lineNum = line.substring(line.indexOf('_') + 1)
        document.getElementById(`input_${lineNum}`).value = "";
        document.getElementById(`answer_${lineNum}`).value = "";
    } else {
        document.getElementById("Links").removeChild(rows[line])

        // Remove the row from the rows array.
        for (const row in rows) {
            console.log(row)
            if (rows[row].id == line)
                {
                    delete rows[row];
                    break;
                }
        }
    }
}

async function SubmitSet() {
    // Move the user to the loading screen.
    document.getElementById("SetLoadingScreen").hidden = false;
    document.getElementById("SetMaker").hidden = true;

    // Get the data to be sent.
    let setData = {
        "Name": document.getElementById("SetName").value,
        "ObjectName": document.getElementById("ObjectName").value,
        "AnswerName": document.getElementById("AnswerName").value,
        "Set": getSetData(),
        "Visibility": document.getElementById("PublicPrivateSelector").value,
        "Notes": document.getElementById("NotesInput").value
    }

    let data = {
        "login_token": login_token,
        "Set": setData
    }

    if (SetCreationMode != "Create")
        setData.ID = EditSetID;
    

    // Send it to the server, but only if we're logged in, as a precaution.
    if (login_token != -1) {
        let CreationMode = SetCreationMode == "Create" ? "CreateList.js": "UpdateList.js";

        function postSet() {
            postJSON(`./Post_Modules/${CreationMode}`, data)
                .then(async (resp) => {
                    // If something went wrong, relog and try again.
                    if (!resp.sucessful) {
                        await ReLog();
                        data.login_token = login_token;
                        postSet();
                    } else {
                        document.getElementById("SetLoadingScreen").hidden = true;
                        document.getElementById("SetLoadedScreen").hidden = false;

                        // Update the set listings. 
                        UpdateVisibleSets();

                        // Make sure that the set uploaded text shows correctly.
                        document.getElementById("SetLoadedText").innerText = SetCreationMode == "Edit" ? "Edits saved! They should be visible now." : "Set created! It should be visible now."
                        
                        // Swap the mode to Editing, set the edit ID correctly, if it's not already set.
                        if (SetCreationMode != "Edit") {
                            SetCreationMode = "Edit"
                            EditSetID = resp.ID;
                        }

                        // After like 10 seconds, change the text to be a reminder to save edits before exiting. 
                        setTimeout(() =>
                            document.getElementById("SetLoadedText").innerText = "Make sure to save your edits before leaving!"
                        , 10000);
                    }
                });
        }

        postSet();
    }
}

function getSetData() {
    // Loop through the rows and put them in an array.
    let data = [];
    Object.keys(rows).forEach(row => {
        let rowNum = row.split("_")
        rowNum = Number.parseInt(rowNum[rowNum.length - 1]);
        let rowData = {};
        rowData[document.getElementById(`input_${rowNum}`).value] = document.getElementById(`answer_${rowNum}`).value
        data.push(rowData);
    });
    return data;
}

function DeleteSet() {
    if (SetCreationMode != "Create" && EditSetID != -1) {
        // Delete the set and return back to the main menu.
        postJSON("./Post_Modules/DeleteList.js", {
            "token": login_token,
            "Set": EditSetID
        });
        UpdateVisibleSets();
        ClearRows();
        ToggleSetDisplay();
    }
}