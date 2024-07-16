const fp = require('fs/promises');
const fs = require('fs')

fs.readdirSync(__dirname).forEach(file => {
    if (file.includes("(1)")) fp.unlink(`./${file}`);
})