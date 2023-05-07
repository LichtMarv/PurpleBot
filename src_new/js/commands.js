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
            await interaction.deferReply({ ephemeral: true });
            var table = new AsciiTable("Command Help");
            //table.setHeading('Name', 'Aliases', 'Description');
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle("HELP")
                .setColor(0xf5cd07);
            for (let i = 0; i < cmds.length; i++) {
                var c = cmds[i];
                embed.addFields([{ name: c.name, value: c.description }]);
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
        name: "log",
        description: "shows you the custom bot log",
        log: false,
        options: [{ name: "page", type: "string", description: "page of the log", required: false }],
        run: async function (interaction) {
            await interaction.deferReply({ ephemeral: true });
            let user = interaction.member;
            let pageString = interaction.options.getString("page", false);
            const elemPerPage = 10;
            let page;
            if (pageString == null)
                page = 0;
            else
                page = Number.parseInt(pageString);
            if (interaction.guildId == null) {
                return "I HATE THIS STUPID FUCKING BOT (log command in  commands.ts)";
            }
            if ((user?.permissions).has(discord_js_1.PermissionsBitField.Flags.ViewAuditLog)) {
                let serverInfo = await common.getServerInfo(interaction.guildId);
                let log = serverInfo.log;
                if (log) {
                    let table = new AsciiTable("Log #" + page.toString() + " (new to old)");
                    table.setHeading("Type", "Time", "Message");
                    let show = false;
                    for (let i = 1 + page * elemPerPage; i <= 10 && i <= log.length; i++) {
                        const element = log[log.length - i];
                        let time = new Date(element.time);
                        // 20/12/22, 23:56:17
                        let timeStr = common.dateFormat(time, "%d/%m/%y, %H:%M:%S");
                        table.addRow(element.type, timeStr, element.msg);
                        show = true;
                    }
                    if (show)
                        return { content: "```hs\n" + table.toString() + "```" };
                    else
                        return "we are out of pages, please turn back";
                }
                else {
                    return "No log files found :(";
                }
            }
            else {
                return "you do not have the needed permissions to view the log :(";
            }
        }
    },
    {
        name: "move",
        description: "move specified song to top",
        options: [{ name: "song", type: "int", description: "index of song", required: true }],
        run: async function (interaction) {
            let arg = interaction.options.getInteger("song", true);
            let server = await common.getServerInfo(interaction.guildId);
            let queue = server.musicQueue;
            if (queue && arg > 0 && arg < queue.length) {
                let cur = queue.shift();
                if (!cur)
                    return null;
                let toMove = queue.splice(arg - 1, 1)[0];
                queue.unshift(toMove);
                queue.unshift(cur);
                await common.setServerInfo(interaction.guildId, { musicQueue: queue });
                (0, music_1.showQueue)(interaction.guildId);
            }
            return { content: "movin song ...", ephemeral: true };
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
                let newChannel = await interaction.guild?.channels.create({ name: "🎵┃Music Channel" });
                if (newChannel == undefined)
                    return "ERROR";
                let queue = (await common.getServerInfo(interaction.guildId)).musicQueue;
                await newChannel.send({ files: [{ attachment: "resource/banner.png" }] });
                let mymsg = await newChannel.send({ content: "​\n__Queue empty__" });
                await common.setServerInfo(interaction.guild?.id, { musicChannel: newChannel.id, musicMessage: mymsg.id, musicQueue: [] });
                (0, music_1.showQueue)(interaction.guildId);
                return `created channel <#${newChannel.id}>`;
            }
        }
    },
    /* {
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
            if (ch instanceof TextChannel) {
                ch.send(msg);
                return { content: "send msg!", ephemeral: true };
            }

            return null
        }
    }, */
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
            var index = interaction.options.getInteger("position", true) - 1;
            let guild = interaction.guild;
            if (days == null)
                var memes = await common.memesdb.find({ server: guild?.id }, { limit: index + 1, sort: { score: -1, time: 1 } });
            else
                var memes = await common.memesdb.find({ server: guild?.id, time: { $gte: Date.now() - 86400000 * days } }, { limit: index + 1, sort: { score: -1, time: 1 } });
            var channel = (await common.client.channels.fetch(memes[index].channel));
            var memeMsg = await channel?.messages.fetch(memes[index].msg);
            //console.log("get command used! " + memeMsg.content.split(" ")[1] + " | " + memeMsg.url);
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('Here is the link to meme #' + (index + 1))
                .setColor(0xf5cd07)
                .setDescription("[Go to Meme](" + memeMsg.url + ")");
            return { embeds: [embed], ephemeral: true };
        }
    },
    {
        name: "dictionary",
        description: "get the most upvoted definition of a wrod from urban dictionary",
        options: [
            { name: "query", type: "string", description: "think to search", required: true },
        ],
        run: async function (interaction) {
            await interaction.deferReply({ ephemeral: true });
            let word = interaction.options.getString("query", true);
            const url = 'https://mashape-community-urban-dictionary.p.rapidapi.com/define?term=' + encodeURIComponent(word);
            const options = {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': '3d5b80d566msh08c82aeb1172313p1bf7edjsn0674fe77c385',
                    'X-RapidAPI-Host': 'mashape-community-urban-dictionary.p.rapidapi.com'
                }
            };
            let res = await (await fetch(url, options)).json();
            if (res.list.length > 0) {
                let elem = res.list[0];
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle(word)
                    .setColor(0xf5cd07)
                    .setDescription(elem.definition)
                    .setFooter({ text: elem.written_on + ", Likes: " + elem.thumbs_up + " | dislikes: " + elem.thumbs_down })
                    .setAuthor({ name: elem.author })
                    .setURL(elem.permalink)
                    .addFields({ name: "example", value: elem.example });
                return { embeds: [embed] };
            }
            return "Not found on Urban Dictionary";
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
    return true;
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
