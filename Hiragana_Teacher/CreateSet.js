let rows = {};
rows["line_0"] = document.getElementById("line_0");
let template_innerHTML = document.getElementById("line_0").innerHTML;

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
}

function Remove_Line(line) {
    // If this isn't the only row, remove it.
    if (Object.keys(rows).length == 1) return;
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

async function SubmitSet() {
    // Move the user to the loading screen.
    document.getElementById("SetLoadingScreen").hidden = false;
    document.getElementById("SetMaker").hidden = true;

    // Get the data to be sent.
    let setData = {
        "Name": document.getElementById("SetName").value,
        "ObjectName": document.getElementById("ObjectName").value,
        "AnswerName": document.getElementById("AnswerName").value,
        "Set": getSetData()
    }

    let data = {
        "login_token": login_token,
        "Set": setData
    }
    

    // Send it to the server, but only if we're logged in.
    if (login_token != -1)
        postJSON("./Post_Modules/CreateList.js", data)
        .then(() => {
            document.getElementById("SetLoadingScreen").hidden = true;
            document.getElementById("SetLoadedScreen").hidden = false;
        });
}

function getSetData() {
    // Loop through the rows and put them in an array.
    let data = [];
    Object.keys(rows).forEach(row => {
        let rowNum = row.split("_")
        rowNum = Number.parseInt(rowNum[rowNum.length - 1]);
        console.log(rowNum);
        let rowData = {};
        rowData[document.getElementById(`input_${rowNum}`).value] = document.getElementById(`answer_${rowNum}`).value
        data.push(rowData);
    });
    return data;
}