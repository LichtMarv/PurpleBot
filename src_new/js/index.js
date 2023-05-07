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
const fs = __importStar(require("fs"));
const commands_1 = require("./commands");
const buttons_1 = require("./buttons");
const music_1 = require("./music");
dotenv.config();
async function checkDelete() {
    var toDelete = await common.deletedb.find({ timeout: { $lt: Date.now() } });
    if (toDelete == null)
        return;
    for (let i = 0; i < toDelete.length; i++) {
        //console.log(toDelete[i]);
        const element = toDelete[i];
        try {
            const channel = await common.client.channels.fetch(element.channel);
            var msg = await channel?.messages.fetch(element.msg);
            //console.log(msg);
            msg.delete();
        }
        catch {
            console.log("msg not found on discord ... not deleting!");
        }
        await common.deletedb.remove({ _id: element._id });
    }
    setTimeout(function () {
        checkDelete();
    }, 2000);
}
common.client.on("ready", async () => {
    console.log(`Logged in as ${common.client.user?.tag}!`);
    //google.test()
    fs.readFile(__dirname + '/../../resource/activity.txt', function (err, data) {
        if (err) {
            throw err;
        }
        var activities = data.toString().split("\n");
        var r = Math.floor(Math.random() * activities.length);
        common.client?.user?.setActivity("with your " + activities[r]);
    });
    console.log("registering commands ...");
    const guilds = common.client.guilds.cache;
    await (0, commands_1.registerCommands)(guilds);
    console.log("registered commands!");
    checkDelete();
});
common.client.on("voiceStateUpdate", async (ov, nv) => {
    let member = await (await common.client.guilds.fetch(ov.guild.id)).members.fetch(common.client.user?.id);
    if (member.voice.channel) {
        if (member.voice.channel.members.size <= 1) {
            (0, music_1.stopMusic)(ov.guild.id);
        }
    }
    //console.log(common.client.voice.adapters);
});
common.client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial)
        await reaction.fetch();
    /* if(reaction.partial)
        return; */
    //console.log("reaction remove " + reaction._emoji.name + " x" + reaction.count);
    const emoji = reaction.emoji.name;
    let count = reaction.count;
    if (count == null)
        count = 0;
    if (emoji === "⬆") {
        var meme = await common.memesdb.findOne({ msg: reaction.message.id, channel: reaction.message.channel.id });
        var score = count - meme.downvote;
        var diff = score - meme.score;
        await common.userdb.update({ user: meme.author, server: reaction.message.guild?.id }, { $inc: { score: diff } });
        await common.memesdb.update({ msg: reaction.message.id, channel: reaction.message.channel.id }, { $set: { upvote: count, score: score } });
    }
    else if (emoji === "⬇") {
        var meme = await common.memesdb.findOne({ msg: reaction.message.id, channel: reaction.message.channel.id });
        var score = meme.upvote - count;
        var diff = score - meme.score;
        await common.userdb.update({ user: meme.author, server: reaction.message.guild?.id }, { $inc: { score: diff } });
        await common.memesdb.update({ msg: reaction.message.id, channel: reaction.message.channel.id }, { $set: { downvote: count, score: score } });
    }
});
common.client.on('messageReactionRemove', async (reaction, user) => {
    if (reaction.partial)
        await reaction.fetch();
    //console.log("reaction remove " + reaction._emoji.name + " x" + reaction.count);
    const emoji = reaction.emoji.name;
    let count = reaction.count;
    if (count == null)
        count = 0;
    if (emoji === "⬆") {
        var meme = await common.memesdb.findOne({ msg: reaction.message.id, channel: reaction.message.channel.id });
        var score = count - meme.downvote;
        var diff = score - meme.score;
        await common.userdb.update({ user: meme.author, server: reaction.message.guild?.id }, { $inc: { score: diff } });
        await common.memesdb.update({ msg: reaction.message.id, channel: reaction.message.channel.id }, { $set: { upvote: count, score: score } });
    }
    else if (emoji === "⬇") {
        var meme = await common.memesdb.findOne({ msg: reaction.message.id, channel: reaction.message.channel.id });
        var score = meme.upvote - count;
        var diff = score - meme.score;
        await common.userdb.update({ user: meme.author, server: reaction.message.guild?.id }, { $inc: { score: diff } });
        await common.memesdb.update({ msg: reaction.message.id, channel: reaction.message.channel.id }, { $set: { downvote: count, score: score } });
    }
});
common.client.on("messageCreate", async (msg) => {
    if (msg.author.id == common.client.user?.id)
        return;
    let server = await common.getServerInfo(msg.guildId);
    let channel = null;
    if (server && server.musicChannel)
        channel = await common.client.channels.fetch(server.musicChannel).catch(console.error);
    if (msg.channel == channel) {
        let args = msg.content.split(" ");
        await (0, music_1.requestSong)(msg.content, msg.member?.voice.channel, msg.member ? msg.member : msg.author).catch((e) => { throw e; });
        await msg.delete().catch(console.log);
    }
    for (const user of msg.mentions.users) {
        if (user[1].id == common.client.user?.id) {
            msg.reply("all bot commands use the / system, so use that");
        }
    }
});
common.client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.guildId == null)
        return;
    for (let i = 0; i < commands_1.cmds.length; i++) {
        const command = commands_1.cmds[i];
        if (interaction.commandName === command.name) {
            if (command.log != false) {
                common.Log(interaction.guildId, common.LogDataType.MSG, interaction.member?.user.username + " used command '" + command.name + "'");
            }
            const res = await command.run(interaction);
            if (res) {
                if (interaction.deferred)
                    await interaction.editReply(res);
                else
                    await interaction.reply(res);
            }
        }
    }
});
common.client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton() || interaction.guildId == null)
        return;
    for (let i = 0; i < buttons_1.btns.length; i++) {
        const btn = buttons_1.btns[i];
        if (btn.id == interaction.customId) {
            common.Log(interaction.guildId, common.LogDataType.MSG, interaction.member?.user.username + " used the Button '" + btn.name + "'");
            const res = await btn.run(interaction);
            if (res)
                if (interaction.deferred)
                    await interaction.editReply(res);
                else
                    await interaction.reply(res);
            break;
        }
    }
});
common.client.login(process.env.TOKEN);
