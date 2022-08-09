async function run() {
    let StrigoiNum = document.getElementById('StrigoiNum').value;
    let SpiritNum = document.getElementById('SpiritNum').value;
    if (StrigoiNum === "Spirit Number" || SpiritNum === "Spirit Number") {
      // Do Nothing.
    } else {
      let url = "https://micahb.dev/json/" + StrigoiNum + "/" + SpiritNum + "/1.json";
      document.getElementById('information').innerHTML = "loading: " + url;
      let panelOne = await fetch(url).then(response => response.json());
      // let json1 = panelOne.json();
      let parsedResponse = "";
      for (let i = 0; i < panelOne.content.length; i++) {
        parsedResponse += "<br>" + await panelOne.content[i];
      }
      
      parsedResponse += "<br>"
      
      if (panelOne.length > 1) {
        for (let i = 2; i <= panelOne.length; i++) {
          let panelXX = await fetch("https://micahb.dev/json/" + StrigoiNum + "/" + SpiritNum + "/" + i + ".json").then(response => response.json());
          for (let i = 0; i < panelXX.content.length; i++) {
            parsedResponse += panelXX.content[i] + "<br>";
          }
        }
      }

      document.getElementById('information').innerHTML = parsedResponse.replaceAll("\n", "<br>").replaceAll("\t", "<a class=\"invis\">......</a>");
    }
  // let response = await fetch(); 
}