//Ignore ts(80001)
const { SlashCommandBuilder, CommandInteraction, PermissionsBitField } = require('discord.js');
const fs = require('fs')

const { GetPlayerIDFromDiscordID } = require('../Esports_Index.js')
const ThreadPrefix = "Event Thread ";
const PlayersPath = "Esports_Projects/Players";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Opens a thread for event information tracking.')
        // Make it so only admin can see this command.
        .addIntegerOption(option => {
            return option.setName("code")
                .setDescription("The link code that the website gave you.")
                .setMinValue(0).setMaxValue(999999)
                .setRequired(true);
        }),

    /**
     * Interacts with the passed message.
     * @param {CommandInteraction} message 
     */
    async execute(message) {
        let { global, GetFileFromCache } = require('../../index.js')
        let c = "/link"
        if (c.startsWith("/link")) {
            const link_code = message.options.getInteger("code");
    
            // Fetch player information from cache.
            let playerInfo = global.playerCache[link_code];
            if (playerInfo == undefined) {
                message.reply("Invalid link code! Check your code, please.");
                return false;
            }
    
            // Assumes a valid link code and collates player data.
            const Full_Player_Information = {
                "Name": playerInfo.Player,
                "PlayedGames": playerInfo.Games,
                "Discord_id": message.member.id,
                "Student_id": playerInfo.Id,
                "Grade": playerInfo.Grade,
                "Ranks": playerInfo.Ranks
            }
            // Save data to player database.
                // If the player is already registered, update their existing profile.
            let ReplyStart = "Registration suceeded!"
            if (GetPlayerIDFromDiscordID(message.member.id) != -1) {
                global.playerCache[link_code] = undefined;
                link_code = GetPlayerIDFromDiscordID(message.member.id);
                ReplyStart = "Profile Updated!";

                // Clear file cache if the player is updating.
                global.File_Cache = null;
            }
            fs.writeFileSync(`${PlayersPath}/${link_code}.json`, JSON.stringify(Full_Player_Information));
    
            // Invalidate cached version of the player.
            global.playerCache[link_code] = undefined;

            message.reply(`${ReplyStart} Check the website to make sure it went through.`);
    
            // Rename the user to have their name as their username.
            message.member.setNickname(playerInfo.Player, "Changed user's nickname to match their registered name.")
                // Send them a message if it failed.
                .catch(() => 
                    message.channel.send(`I tried to rename you but I can't because I don't have permission; If you could please rename yourself to \`${Full_Player_Information.Name}\`, That'd be great.`)
                );
        }
    }
}