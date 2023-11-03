//Ignore ts(80001)
const { SlashCommandBuilder, CommandInteraction, PermissionsBitField } = require('discord.js');
const fs = require('fs')

const { GetPlayerIDFromDiscordID } = require('../Esports_Index.js')
const ThreadPrefix = "Event Thread ";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createevent')
        .setDescription('Opens a thread for event information tracking.')
        // Make it so only admin can see this command.
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    /**
     * Interacts with the passed message.
     * @param {CommandInteraction} interaction 
     */
    async execute(message) {
        await message.deferReply();
        let { global, GetFileFromCache } = require('../../index.js');
        if (!message.channel.isThread()) {
            // Use the spawner's ID as the index in the event thread cache.
            let ThreadID;
            do {
                ThreadID = Math.floor(Math.random() * 9999);
            } while (global.ThreadCache[ThreadID] != null)

            global.ThreadCache[ThreadID] = message.channel.threads.create({
                name: `${ThreadPrefix}${ThreadID}`,
                autoArchiveDuration: 60,
                reason: 'Tracking ESports Event.',
            });
            let thread = await global.ThreadCache[ThreadID];

            // Join thread and tell the user that we're watching it.
            thread.send("I'm tracking an ESports Event in this thread. Make sure to use `/complete` when you're done, or your attendance may be lost!\nAlso, use `/addGame *` to add the games that are taking place today, please.\nIf you forgot, you can add people using `/here @-`, or excuse them with `/excuse @ *` Where @- is a series of usernames, @ is one username, and * is a reason.")
                // .then(message => console.log(`Sent message: ${message.content}`))
                .catch(console.error);

            // Tell the user to enter the thread to begin logging attendance.
            message.editReply("Enter the above thread in order to begin tracking attendance.")

            // Create event in cache.
            let date = new Date();
            let today = date.toISOString().slice(0, 10).replaceAll("-", "/");
            let hours = date.getHours();
            let minutes = date.getMinutes().toString();
            while (minutes.length < 2) minutes = "0" + minutes;
            global.EventCache[ThreadID] = {
                "Attending": [],
                "Excused": [],
                "Date": today,
                "StartTime": `${hours}:${minutes}`,
                "Games": []
            }

            // Add the current user to be attending, if they're registered.
            let userID = GetPlayerIDFromDiscordID(message.member.id);
            if (userID != -1)
                global.EventCache[ThreadID].Attending.push(userID);
            else 
                message.channel.send("I tried to add you to the attendance, but it doesn't appear that you're registered.");

            console.log(`Created a new event: ${thread.name}.`);
        } else if (c.startsWith("/createEvent"))
            message.editReply("You can't create events in a thread!");
    },
};