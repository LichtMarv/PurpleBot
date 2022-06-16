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
const music_1 = require("./music");
const AsciiTable = require("ascii-table");
const cmds = [
    {
        name: "help",
        description: "lists the commands i guess",
        run: async function (interaction) {
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
        run: async function (interaction) {
            return `Pong! ${Date.now() - interaction.createdTimestamp}ms. API: ${Math.round(common.client.ws.ping)}ms`;
        }
    },
    {
        name: "test",
        description: "the command i use for testing stuff",
        options: [{ name: "var1", type: "string", description: "variable", required: true }],
        run: async function (interaction) {
            let arg = interaction.options.getString("var1", true);
            let vc = interaction.member?.voice.channel;
            (0, music_1.requestSong)(arg, vc, interaction.member);
            return { content: "maybe working", ephemeral: true };
        }
    },
    {
        name: "setup",
        description: "creates Purple Music Channel for your music needs",
        options: [{ name: "channel", type: "channel", description: "the channel to use (will void)", required: false }],
        run: async function (interaction) {
            console.log("setup ...");
            let server = await common.getServerInfo(interaction.guildId);
            let channel = undefined;
            if (server) {
                if (server.musicChannel)
                    channel = await common.client.channels.fetch(server.musicChannel).catch(console.error);
                if (!channel) {
                    await common.setServerInfo(interaction.guildId, { musicChannel: "" });
                }
            }
            if (channel) {
                console.log(channel.name);
                return `channel already exists : <#${channel.id}>`;
            }
            else {
                let newChannel = await interaction.guild?.channels.create("🎵┃Purple Music");
                if (newChannel == undefined)
                    return "ERROR";
                let queue = (await common.getServerInfo(interaction.guildId)).musicQueue;
                const embed = await (0, music_1.CreateEmbed)(queue, interaction.guildId);
                await newChannel.send({ files: [new discord_js_1.MessageAttachment("resource/banner.png")] });
                let mymsg = await newChannel.send({ content: "​\n__Queue empty__", embeds: [embed] });
                await common.setServerInfo(interaction.guild?.id, { musicChannel: newChannel.id, musicMessage: mymsg.id });
                return `created channel <#${newChannel.id}>`;
            }
        }
    },
    {
        name: "say",
        description: "post Message in Channel",
        options: [
            { name: "message", type: "string", description: "the Message to post", required: true },
            { name: "channel", type: "channel", description: "the Channel to post the Message in", required: false }
        ],
        run: async function (interaction) {
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
        run: async function (interaction) {
            console.log("New message marked on " + interaction.guild?.name);
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
                const mem = interaction.member;
                await common.memesdb.insert({ server: res.guild?.id, msg: res.id, channel: res.channel.id, author: mem.id, score: 0, upvote: 1, downvote: 1, time: Date.now() });
                var user = await common.userdb.findOne({ server: res.guild?.id, user: mem.id });
                if (user == null) {
                    await common.userdb.insert({ user: mem.id, server: res.guild?.id, score: 0 });
                }
                await res.react("⬆");
                await res.react("⬇");
            }
            else {
                interaction.editReply("ERROR: couldn't add reactions to Message!");
            }
            return null;
        }
    },
    {
        name: "leaderboard",
        description: "Shows top memes or users",
        builder: async function () {
            let data = new builders_1.SlashCommandBuilder()
                .setName(this.name)
                .setDescription(this.description)
                .addSubcommand(subcommand => subcommand
                .setName('memes')
                .setDescription('Shows top memes of given time (default:alltime)')
                .addIntegerOption(option => option.setName("days").setDescription('the timespan to look for memes').setRequired(false)))
                .addSubcommand(subcommand => subcommand
                .setName('users')
                .setDescription('Shows top meme users'));
            return data;
        },
        run: async function (interaction) {
            await interaction.deferReply({ ephemeral: true });
            if (interaction.options.getSubcommand() == "memes") {
                var days = interaction.options.getInteger("days", false);
                let guild = interaction.guild;
                if (days == null)
                    var memes = await common.memesdb.find({ server: guild?.id }, { limit: 10, sort: { score: -1, time: 1 } });
                else
                    var memes = await common.memesdb.find({ server: guild?.id, time: { $gte: Date.now() - 86400000 * days } }, { limit: 10, sort: { score: -1, time: 1 } });
                if (days == null)
                    var table = new AsciiTable("Top Memes Of All Time");
                else
                    var table = new AsciiTable("Top Memes " + days + " Days");
                table.setHeading('#', '⬆', 'Author');
                for (let i = 0; i < memes.length; i++) {
                    const meme = memes[i];
                    let user = meme.author;
                    let mem = await guild?.members.fetch(user);
                    table.addRow(i + 1, meme.upvote - meme.downvote, mem?.user.username);
                }
                return { content: "```hs\n" + table.toString() + "```", ephemeral: true };
            }
            else {
                let guild = interaction.guild;
                var users = await common.userdb.find({ server: guild?.id }, { limit: 5, sort: { score: -1 } });
                var table = new AsciiTable("Top Memers Of All Time");
                //console.log(Date.now());
                table.setHeading('#', '⬆', 'Memer', 'Award');
                var awards = ["Gigachad", "Big Chungus", "Meme Man"];
                for (let i = 0; i < users.length; i++) {
                    var user = users[i];
                    var member = await guild?.members.fetch(user.user);
                    table.addRow(i + 1, user.score, member?.user.username, awards[i]);
                }
                return { content: "```hs\n" + table.toString() + "```", ephemeral: true };
            }
        }
    },
    {
        name: "getmeme",
        description: "get meme in specified position in the top list of given time",
        options: [
            { name: "position", type: "int", description: "position of meme in top list", required: true },
            { name: "days", type: "int", description: "the timespan to look for memes", required: false }
        ],
        run: async function (interaction) {
            await interaction.deferReply({ ephemeral: true });
            var days = interaction.options.getInteger("days", false);
            let guild = interaction.guild;
            if (days == null)
                var memes = await common.memesdb.find({ server: guild?.id }, { limit: 10, sort: { score: -1, time: 1 } });
            else
                var memes = await common.memesdb.find({ server: guild?.id, time: { $gte: Date.now() - 86400000 * days } }, { limit: 10, sort: { score: -1, time: 1 } });
            var index = interaction.options.getInteger("position", true) - 1;
            var channel = (await common.client.channels.fetch(memes[index].channel));
            var memeMsg = await channel?.messages.fetch(memes[index].msg);
            //console.log("get command used! " + memeMsg.content.split(" ")[1] + " | " + memeMsg.url);
            const embed = new discord_js_1.MessageEmbed()
                .setTitle('Here is the link to meme #' + (index + 1))
                .setColor(0xf5cd07)
                .setDescription("[Go to Meme](" + memeMsg.url + ")");
            return { embeds: [embed], ephemeral: true };
        }
    }
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
                case "int":
                    data.addIntegerOption(op => op.setName(option.name).setDescription(option.description).setRequired(option.required));
                    break;
                default:
                    break;
            }
        });
        console.log("built /" + cmd.name);
        datas.push(data);
    }
    return datas;
}
async function deleteCommands() {
    common.client.guilds.cache.forEach((val, key) => {
        console.log("deleting commands for " + val.name);
        val.commands.set([]).catch(e => {
            if (e instanceof discord_js_1.DiscordAPIError && e.code == 50001) {
                return;
            }
            else {
                console.error(e);
            }
        });
    });
}
//TODO: make function to detect change in slash command for reregister
async function shouldUpdate() {
    return false;
}
async function registerCommands(guilds) {
    if (!await shouldUpdate())
        return;
    await deleteCommands();
    const datas = await buildCommands();
    let failed = {};
    let cmdCount = 0;
    for (const guildCol of guilds) {
        const guild = guildCol[1];
        for (let data of datas) {
            cmdCount++;
            guild.commands.create(data.toJSON()).catch(e => {
                if (e instanceof discord_js_1.DiscordAPIError && e.code == 50001) {
                    failed[guild.id] = true;
                }
                else {
                    console.error(e);
                }
            }).finally(() => {
                cmdCount--;
                if (cmdCount <= 0)
                    if (failed[guild.id])
                        console.log("no permission for guild: " + guild);
            });
        }
    }
}
exports.registerCommands = registerCommands;
