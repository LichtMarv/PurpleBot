import * as dotenv from "dotenv";
import * as common from "./common";
import { cmds, registerCommands } from "./commands";
import { btns } from "./buttons";
import { TextChannel, VoiceChannel } from "discord.js";
import { requestSong, stopMusic } from "./music";
dotenv.config()

async function checkDelete() {
    var toDelete = await common.deletedb.find({ timeout: { $lt: Date.now() } });
    if (toDelete == null)
        return;
    for (let i = 0; i < toDelete.length; i++) {
        //console.log(toDelete[i]);
        const element = toDelete[i];
        try {
            const channel = await common.client.channels.fetch(element.channel);
            var msg = await (channel as TextChannel)?.messages.fetch(element.msg);
            //console.log(msg);
            msg.delete();
        }
        catch {
            console.log("msg not found on discord ... not deleting!")
        }
        await common.deletedb.remove({ _id: element._id })
    }
    setTimeout(function () {
        checkDelete();
    }, 2000);
}


common.client.on("ready", async () => {
    console.log(`Logged in as ${common.client.user?.tag}!`);
    console.log("registering commands ...");
    const guilds = common.client.guilds.cache
    await registerCommands(guilds);
    console.log("registered commands!")
    checkDelete();
});

common.client.on("voiceStateUpdate", async (ov, nv) => {
    let member = await (await common.client.guilds.fetch(ov.guild.id)).members.fetch(common.client.user?.id as string);
    if (member.voice.channel) {
        if (member.voice.channel.members.size <= 1) {
            stopMusic(ov.guild.id);
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
    } else if (emoji === "⬇") {
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
    } else if (emoji === "⬇") {
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

    let server = await common.getServerInfo(msg.guildId as string);
    let channel = null;
    if (server && server.musicChannel)
        channel = await common.client.channels.fetch(server.musicChannel).catch(console.error);
    if (msg.channel == channel) {
        let args = msg.content.split(" ");
        await requestSong(msg.content, msg.member?.voice.channel as VoiceChannel).catch((e) => { throw e });
        await msg.delete().catch(console.log);
    }

    for (const user of msg.mentions.users) {
        if (user[1].id == common.client.user?.id) {
            msg.reply("all bot commands use the / system, so use that. \n you may need to authorize it again: https://discord.com/api/oauth2/authorize?client_id=833423629504348160&permissions=8&scope=bot%20applications.commands")
        }
    }
});

common.client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    for (let i = 0; i < cmds.length; i++) {
        const command = cmds[i];

        if (interaction.commandName === command.name) {
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
    if (!interaction.isButton()) return;

    for (let i = 0; i < btns.length; i++) {
        const btn = btns[i];
        if (btn.id == interaction.customId) {
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