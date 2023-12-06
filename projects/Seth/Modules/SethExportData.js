const UserFolderPath = "./projects/Seth/users/", fs = require('fs');

// Read in all user files.
let data = [];
let paths = fs.readdirSync(UserFolderPath);

for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    data.push(new Promise(res => {
        fs.readFile(UserFolderPath + path, (err, data) => {
            if (err) {
                console.log(err);
            }

            res(JSON.parse(data));
        })
    }))
}

// Once all data has been read, process it into CSV.
Promise.all(data).then(values => {
    
    let CSV = "Name,EarlyMorningActivities,HoursOfSleep,BedTime,WakeTime,Sex,Age,Grade,GameNum,Timestamp,Score,Part or Timings (ms)";
    values.forEach(player => {
        const questionnaire = player.questionnaire;
        let RoundRowBase = `\n${player.username},${questionnaire.EarlyMorningActivities},${questionnaire.HoursOfSleep},${questionnaire.BedTime},${questionnaire.WakeTime},${questionnaire.Sex},${questionnaire.Age},${questionnaire.Grade}`;
        
        if (player.rounds != undefined) 
            player.rounds.forEach(round => {
                const game = round.game;
                const timestamp = round.timestamp;
                let score;
                let Accessory;
                switch (game) {
                    case 1:
                        score = round.stats.score;
                        Accessory = round.stats.times;
                        break;
                    
                    case 2:
                        score = round.stats.toString();
                        Accessory = "";
                        break;

                    case 3:
                        score = round.stats.score;
                        Accessory = round.stats.part;
                        break;

                    default:
                        score = -1;
                        Accessory = "ERROR! Invalid record."
                        break;
                }

                CSV += `${RoundRowBase},${game},${timestamp},${score},"${Accessory}"`;
            })
    })

    // Send the data back.
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("content-disposition", "attachment; filename=\"PlayerData.csv\"")
    res.end(CSV);
});