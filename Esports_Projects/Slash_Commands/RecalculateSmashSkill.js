//Ignore ts(80001)
const { SlashCommandBuilder, CommandInteraction, PermissionsBitField } = require('discord.js');
const fs = require('fs')

const { GetPlayerIDFromDiscordID } = require('../Esports_Index.js')
const ThreadPrefix = "Event Thread ";
const PlayersPath = "Esports_Projects/Players";
const GamesPath = "Esports_Projects/Games";

const GetMatchesByTime = async () => {
    const dir = GamesPath;
    const files = await fs.promises.readdir(dir);
  
    return files
      .map(fileName => ({
        name: fileName,
        time: fs.statSync(`${dir}/${fileName}`).mtime.getTime(),
      }))
      .sort((a, b) => a.time - b.time)
      .map(file => file.name);
  };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recalculatesmashskills')
        .setDescription('Recalculates smash skills.')
        // Make it so only admin can see this command.
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    /**
     * Interacts with the passed message.
     * @param {CommandInteraction} message 
     */
    async execute(message) {
        message.reply({ephemeral: true, content: "Check [the website.](https://micahb.dev/Esports_Projects/Attendance_Winrate_Smash_Watcher.html)"})
        let { global, GetFileFromCache } = require('../../index.js')
        
        // First, load all players and clear their smash_skill stat.
        const players = fs.readdirSync(PlayersPath);
        const WritePromises = [];
        players.forEach(playerId => {
            const path = `${PlayersPath}/${playerId}`;
            let player = JSON.parse(GetFileFromCache(path));
            if (player.Smash_Skill != undefined) {
                delete player.Smash_Skill;  
                // Write all files asynchrously.
                let promise = new Promise((resolve, reject) => {
                    fs.writeFile(path, JSON.stringify(player), resolve)
                })
                WritePromises.push(promise)
            }
        });

        // Once all of the files have been updated, get matches sorted by time, then process all of them.
        Promise.all(WritePromises).then(async e => {
            const matches = await GetMatchesByTime();
            matches.forEach(match => {
                // Process these synchronously.
                const data = JSON.parse(GetFileFromCache(`${GamesPath}/${match}`));
                try {
                    global.esports.ProcessSmashMatch(data);
                } catch (e) {
                    console.log(e);
                    console.log(match);
                }
            })
        })
    }
}