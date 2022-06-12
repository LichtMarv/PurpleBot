import * as dotenv from "dotenv";
import * as common from "./common";
import { cmds, registerCommands } from "./commands";
import { btns } from "./buttons";
dotenv.config()

common.client.on("ready", async () => {
    console.log(`Logged in as ${common.client.user?.tag}!`);
    console.log("registering commands ...");
    const guilds = common.client.guilds.cache
    await registerCommands(guilds);
    console.log("registered commands!")
})

common.client.on("messageCreate", async (msg) => {
    if (msg.author.id == common.client.user?.id)
        return;
    for (const user of msg.mentions.users) {
        if (user[1].id == common.client.user?.id) {
            msg.reply("all bot commands use the / system, so use that. \n you may need to authorize it again: https://discord.com/api/oauth2/authorize?client_id=833423629504348160&permissions=8&scope=bot%20applications.commands")
        }
    }
});

common.client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand() || interaction.command == null) return;

    for (let i = 0; i < cmds.length; i++) {
        const command = cmds[i];

        if (interaction.commandName === command.name) {
            const res = await command.run(interaction, interaction.command);
            if (res)
                await interaction.reply(res);
        }
    }

});

common.client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    for (let i = 0; i < btns.length; i++) {
        const btn = btns[i];
        if (btn.id == interaction.customId) {
            const res = await btn.run(interaction);
            if (res)
                await interaction.reply(res);
            break;
        }
    }

});

common.client.login(process.env.TOKEN);