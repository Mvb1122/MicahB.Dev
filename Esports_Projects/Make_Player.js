const WebsiteURL = "https://micahb.dev/Esports_Projects/";

let token;
async function FinishStep0() {
    // Collate grabbed information into an object so it's easier to send.
    let newPlayerInfo = {
        Name: document.getElementById("name").value.trim(),
        Games: document.getElementById("game").value,
        ID: document.getElementById("StudentID").value
    }
    let query = `&name=${escape(newPlayerInfo.Name)}&games=${escape(newPlayerInfo.Games)}&id=${escape(newPlayerInfo.ID)}`

    // Send that to the server.
    await fetch(`${WebsiteURL}Modules/CollatePlayerAndGetLinkToken.js${query}`)
        .then((response) => response.json())
        .then((data) => token = data.Token);

    // Move to the next step where we wait for confirmation of link from Discord.
    document.getElementById("Step0").hidden = true;
    document.getElementById("Step1").hidden = false;
    
    // Hide the button.
    document.getElementById("NextStepButton").hidden = true;

    // Start link status monitoring step.
    StartTokenMonitoring();
}

async function StartTokenMonitoring() {
    document.getElementById("CommandDisplay").innerHTML = `/link ${token}`;

    let data = { Status: "Waiting" };
    do {
        // Send a request to the server asking if the account has been linked yet.
        await fetch(`${WebsiteURL}Modules/GetRegistrationStatus.js&token=${token}`)
            .then((response) => response.json())
            .then((json) => data = json);

        if (data.Status == "Registered") {
            console.log("Registered sucessfully!");
            break;
        }

        console.log("Waiting...");
        // Wait for 500ms, then check again if there was a change
        await new Promise(r => setTimeout(r, 500));
    } while (true)

    // Tell the user that the registration has been completed.
    document.getElementById("Title").innerText = "Registration complete!";
    document.getElementById("Step1").hidden = true;
    document.getElementById("Step2").hidden = false;
}