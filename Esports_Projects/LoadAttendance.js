// From the other file: 
// const WebsiteURL = "https://micahb.dev/Esports_Projects/";
async function LoadAttendance() {
    // Ask the server for attendance information. 
        // Collate Information
    let daysAttended, additionalDaysAttended;
    const player = document.getElementById("player-names").value;

    // If the summary is requested, load it.
    if (player == "summary") return LoadOverallAttendance();

        // Send request
    await fetch(`${WebsiteURL}Modules/GetAttendance.js&player=${player.substring(0, player.indexOf("."))}`)
        .then((response) => response.json())
        .then((d) => {
            daysAttended = d.Days;
            additionalDaysAttended = d.AdditionalDays;
        });
    
    // Compile the recieved data into a human-readable format.
    let output = ""; let numberOfDaysThere = 0;
    daysAttended.forEach(day => {
        let startTag = `<p class="redText">`, endTag = `</p>`;
        let attending = "Not Attending";
        if (day.Attending == true) {
            startTag = `<p class="greenText">`;
            attending = "Attending";
            numberOfDaysThere++;
        } else if (day.Attending.state == "excused") {
            startTag = `<p class="yellowText">`
            attending = "Was excused " + day.Attending.excuse;
            numberOfDaysThere++;
        }

        output += `${startTag}${day.Date}: ${attending}${endTag}`
    });
    
    // Tally up Additional Days
    let sel = document.getElementById("player-names");
    let PlayerFirstName = sel.options[sel.selectedIndex].text;
    PlayerFirstName = PlayerFirstName.substring(0, PlayerFirstName.indexOf(" "));

    output += `<br><h1>Additionally, ${PlayerFirstName} was there for another ${additionalDaysAttended.length} days, outside of their games' specified days.</h1>`
    additionalDaysAttended.forEach(day => {
        output += `<p class="greenText">${day.Date}: Attending</p>`
    });

    document.getElementById("Attendance Display Title").innerText = 
    `${PlayerFirstName} was there ${numberOfDaysThere} days out of ${daysAttended.length} total days. (${(numberOfDaysThere / daysAttended.length) * 100}%)`

    document.getElementById("AttendanceDisplay").hidden = false;
    document.getElementById("Attendance Display").innerHTML = output;
}

async function LoadOverallAttendance() {
    // Get attendance summary from server.
    document.getElementById("Attendance Display Title").innerText = "Events Summary:"
    await fetch(`${WebsiteURL}Modules/GetSummary.js&cache=false`)
        .then((response) => response.text())
        .then((d) => {
            // Put data on screen.
            document.getElementById("AttendanceDisplay").hidden = false;
            document.getElementById("Attendance Display").innerHTML = d.replaceAll("\n", "<br>");
        });
}