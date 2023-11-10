const fs = require('fs')

function Rename(path, name) {
    fs.rename(path, name, (err) => {
        if (err)
            console.log(err);
    })
}

const questions = fs.readdirSync("./");
for (let i = 0; i < questions.length; i++) {
    const dir = questions[i];
    
    if (fs.statSync(dir).isDirectory()) {
        const images = fs.readdirSync(`./${dir}/`);
        
        // Image names by index.
        const names = ["question", "1", "2", "3", "4"];
        for (let j = 0; j < images.length; j++) {
            const image = images[j];
            Rename(`./${dir}/${image}`, `./${dir}/${names[j]}.png`);
        }
    }
}