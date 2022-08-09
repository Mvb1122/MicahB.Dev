// From the other file: 
// const WebsiteURL = "https://micahb.dev/Esports_Projects/";
async function LoadAttendance() {
    // Ask the server for attendance information. 
        // Collate Information
    let daysAttended;
    const player = document.getElementById("player-names").value;
        // Send request
    await fetch(`${WebsiteURL}Modules/GetAttendance.js&player=${player.substring(0, player.indexOf("."))}`)
        .then((response) => response.json())
        .then((d) => {
            daysAttended = d.Days;
        });
    
    // Compile the recieved data into a human-readable format.
    let output = ""; let numberOfDaysThere = 0;
    daysAttended.forEach(day => {
        let startTag = `<p class="redText">`, endTag = `</p>`;
        if (day.Attending) {
            startTag = `<p class="greenText">`;
            numberOfDaysThere++;
        }

        let attending = day.Attending ? "Attending" : "Not Attending";
        output += `${startTag}${day.Date}: ${attending}${endTag}`
    });

    let sel = document.getElementById("player-names");
    let PlayerFirstName = sel.options[sel.selectedIndex].text;
    PlayerFirstName = PlayerFirstName.substring(0, PlayerFirstName.indexOf(" "));
    document.getElementById("Attendance Display Title").innerText = 
    `${PlayerFirstName} was there ${numberOfDaysThere} days out of ${daysAttended.length} total days. (${(numberOfDaysThere / daysAttended.length) * 100}%)`

    document.getElementById("AttendanceDisplay").hidden = false;
    document.getElementById("Attendance Display").innerHTML = output;
}