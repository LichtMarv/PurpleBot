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
exports.registerCommands = exports.cmds = void 0;
const discord_js_1 = require("discord.js");
const builders_1 = require("@discordjs/builders");
const common = __importStar(require("./common"));
const buttons_1 = require("./buttons");
const AsciiTable = require("ascii-table");
const cmds = [
    {
        name: "help",
        description: "lists the commands i guess",
        run: async function (interaction, command) {
            var table = new AsciiTable("Command Help");
            //table.setHeading('Name', 'Aliases', 'Description');
            const embed = new discord_js_1.MessageEmbed()
                .setTitle("HELP")
                .setColor(0xf5cd07);
            for (let i = 0; i < cmds.length; i++) {
                var c = cmds[i];
                embed.addField(c.name, c.description);
            }
            embed.setFooter({ text: "have fun xD" });
            return { embeds: [embed] };
        }
    },
    {
        name: "ping",
        description: "shows you your ping (may be influenced heavily by my internet xD)",
        run: async function (interaction, command) {
            return `Pong! ${Date.now() - interaction.createdTimestamp}ms. API: ${Math.round(common.client.ws.ping)}ms`;
        }
    },
    {
        name: "test",
        description: "testing options be like",
        options: [{ name: "var1", type: "string", description: "just a test param", required: true }],
        run: async function (interaction, command) {
            let s = interaction.options.getString("var1");
            let row = await (0, buttons_1.buildRow)("musicRow");
            return { content: "lol " + s, ephemeral: true, components: [row] };
        }
    },
    {
        name: "say",
        description: "post Message in Channel",
        options: [
            { name: "message", type: "string", description: "the Message to post", required: true },
            { name: "channel", type: "channel", description: "the Channel to post the Message in", required: false }
        ],
        run: async function (interaction, command) {
            const msg = interaction.options.getString("message", true);
            let channel = interaction.options.getChannel("channel", false)?.id;
            if (channel == null && interaction.inGuild())
                channel = await interaction.channelId;
            if (channel == undefined || interaction.guildId == null)
                return null;
            let ch = await (await common.client.guilds.fetch(interaction.guildId)).channels.fetch(channel);
            if (ch instanceof discord_js_1.TextChannel) {
                ch.send(msg);
                return { content: "send msg!", ephemeral: true };
            }
            return null;
        }
    },
    {
        name: "meme",
        description: "Marks a message as a meme for the bot",
        options: [{ name: "link", type: "string", description: "link to the meme", required: true }],
        builder: async function () {
            let data = new builders_1.SlashCommandBuilder()
                .setName(this.name)
                .setDescription(this.description)
                .addSubcommand(subcommand => subcommand
                .setName('link')
                .setDescription('use link of meme')
                .addStringOption(option => option.setName("link").setDescription('link to the meme').setRequired(true)))
                .addSubcommand(subcommand => subcommand
                .setName('attachment')
                .setDescription('use file for meme')
                .addAttachmentOption(option => option.setName("file").setDescription('Image or something').setRequired(true)));
            return data;
        },
        run: async function (interaction, command) {
            console.log("New message marked on " + interaction.guild?.name);
            /* //await memesdb.insert({server:msg.guild.id, msg : msg.id, channel: msg.channel.id, author: msg.author.id,score: 0, upvote : 1, downvote : 1, time: Date.now()});
            //var user = await userdb.findOne({server:msg.guild.id, user:msg.author.id});
            if(user == null) {
                await userdb.insert({user:msg.author.id,server:msg.guild.id, score:0});
            } */
            if (interaction.options.getSubcommand() == "link") {
                const link = interaction.options.getString("link", true);
                await interaction.reply(link);
            }
            else {
                const att = interaction.options.getAttachment("file", true);
                await interaction.reply({ files: [att] });
            }
            let res = await interaction.fetchReply();
            if (res instanceof discord_js_1.Message) {
                await res.react("⬆");
                await res.react("⬇");
            }
            else {
                interaction.editReply("ERROR: couldn't add reactions to Message!");
            }
            return null;
        }
    },
];
exports.cmds = cmds;
async function buildCommands() {
    let datas = [];
    for (let i = 0; i < cmds.length; i++) {
        const cmd = cmds[i];
        if (cmd.builder) {
            let data = await cmd.builder();
            datas.push(data);
            continue;
        }
        let data = new builders_1.SlashCommandBuilder()
            .setName(cmd.name)
            .setDescription(cmd.description);
        cmd.options?.forEach(option => {
            switch (option.type) {
                case "string":
                    data.addStringOption(op => op.setName(option.name).setDescription(option.description).setRequired(option.required));
                    break;
                case "channel":
                    data.addChannelOption(op => op.setName(option.name).setDescription(option.description).setRequired(option.required));
                    break;
                default:
                    break;
            }
        });
        console.log("registering /" + cmd.name);
        datas.push(data);
    }
    return datas;
}
async function deleteCommands() {
    common.client.guilds.cache.forEach((val, key) => {
        console.log("deleting commands for " + val.name);
        val.commands.cache.forEach((cmd, key) => {
            cmd.delete();
        });
    });
}
async function registerCommands(guilds) {
    await deleteCommands();
    const datas = await buildCommands();
    for (const guildCol of guilds) {
        const guild = guildCol[1];
        let failed = false;
        for (let data of datas) {
            await guild.commands.create(data.toJSON()).catch(e => {
                if (e instanceof discord_js_1.DiscordAPIError && e.code == 50001) {
                    failed = true;
                }
                else {
                    console.error(e);
                }
            });
        }
        if (failed)
            console.log("no permission for guild: " + guild);
    }
}
exports.registerCommands = registerCommands;
