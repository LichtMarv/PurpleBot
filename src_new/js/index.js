"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const common = __importStar(require("./common"));
const commands_1 = require("./commands");
const buttons_1 = require("./buttons");
dotenv.config();
common.client.on("ready", async () => {
    console.log(`Logged in as ${common.client.user?.tag}!`);
    console.log("registering commands ...");
    const guilds = common.client.guilds.cache;
    await (0, commands_1.registerCommands)(guilds);
    console.log("registered commands!");
});
common.client.on("messageCreate", async (msg) => {
    if (msg.author.id == common.client.user?.id)
        return;
    for (const user of msg.mentions.users) {
        if (user[1].id == common.client.user?.id) {
            msg.reply("all bot commands use the / system, so use that. \n you may need to authorize it again: https://discord.com/api/oauth2/authorize?client_id=833423629504348160&permissions=8&scope=bot%20applications.commands");
        }
    }
});
common.client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand() || interaction.command == null)
        return;
    for (let i = 0; i < commands_1.cmds.length; i++) {
        const command = commands_1.cmds[i];
        if (interaction.commandName === command.name) {
            const res = await command.run(interaction, interaction.command);
            if (res)
                await interaction.reply(res);
        }
    }
});
common.client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton())
        return;
    for (let i = 0; i < buttons_1.btns.length; i++) {
        const btn = buttons_1.btns[i];
        if (btn.id == interaction.customId) {
            const res = await btn.run(interaction);
            if (res)
                await interaction.reply(res);
            break;
        }
    }
});
common.client.login(process.env.TOKEN);
