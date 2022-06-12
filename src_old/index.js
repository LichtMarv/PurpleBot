#!/usr/bin/env node

require('dotenv').config()
const commands = require("./commands.js");
const fs = require("fs");
const music = require("./music.js");
const common = require("./common.js");
const db = common.db;
const musicdb = common.musicdb;
const purpledb = db.get("prefix");
const memesdb = db.get("memes");
const userdb = db.get("memeUsers");
const deletedb = db.get("deletemsg");
const { getVoiceConnection } = require("@discordjs/voice");

async function checkDelete() {
    var toDelete = await deletedb.find({timeout:{$lt:Date.now()}});
    if(toDelete == null)
        return;
    for (let i = 0; i < toDelete.length; i++) {
        //console.log(toDelete[i]);
        const element = toDelete[i];
        try {
            const channel = await common.client.channels.fetch(element.channel);
            var msg = await channel.messages.fetch(element.msg);
            //console.log(msg);
            msg.delete();
        }
        catch {
            console.log("msg not found on discord ... not deleting!")
        }
        await deletedb.remove({_id:element._id})
    }
    setTimeout(function () {
        checkDelete();
    }, 2000);
}

common.client.on('ready', async () => {
    console.log(`Logged in as ${common.client.user.tag}!`);
    fs.readFile( __dirname + '/../resource/activity.txt', function (err, data) {
        if (err) {
          throw err; 
        }
        var activities = data.toString().split("\n");
        var r = Math.floor(Math.random() * activities.length);
        common.client.user.setActivity("with your " + activities[r]);
      });
    checkDelete();
});

common.client.on("voiceStateUpdate", async (ov,nv) => {
    let member = await (await common.client.guilds.fetch(ov.guild.id)).members.fetch(common.client.user.id);
    if(member.voice.channel) {
        if(member.voice.channel.members.size <= 1) {
            music.stop(ov.guild);
        }
    }  
    //console.log(common.client.voice.adapters);
});

common.client.on('messageReactionAdd', async (reaction, user) => {
    if(reaction.partial)
        await reaction.fetch();
        //console.log("reaction remove " + reaction._emoji.name + " x" + reaction.count);
    const emoji = reaction._emoji.name;
    const count = reaction.count;
    if(emoji === "⬆") {
        var meme = await memesdb.findOne({msg:reaction.message.id,channel:reaction.message.channel.id});
        var score = count - meme.downvote;
        var diff = score - meme.score;
        await userdb.update({user:reaction.message.author.id, server: reaction.message.guild.id}, {$inc:{score:diff}});
        await memesdb.update({msg:reaction.message.id,channel:reaction.message.channel.id}, {$set: {upvote:count, score : score}});
    }else if (emoji === "⬇") {
        var meme = await memesdb.findOne({msg:reaction.message.id,channel:reaction.message.channel.id});
        var score = meme.upvote - count;
        var diff = score - meme.score;
        await userdb.update({user:reaction.message.author.id, server: reaction.message.guild.id}, {$inc:{score:diff}});
        await memesdb.update({msg:reaction.message.id,channel:reaction.message.channel.id}, {$set: {downvote:count, score : score}});
    }
});
common.client.on('messageReactionRemove', async (reaction, user) => {
    if(reaction.partial)
        await reaction.fetch();
    //console.log("reaction remove " + reaction._emoji.name + " x" + reaction.count);
    const emoji = reaction._emoji.name;
    const count = reaction.count;
    if(emoji === "⬆") {
        var meme = await memesdb.findOne({msg:reaction.message.id,channel:reaction.message.channel.id});
        var score = count - meme.downvote;
        var diff = score - meme.score;
        await userdb.update({user:reaction.message.author.id, server: reaction.message.guild.id}, {$inc:{score:diff}});
        await memesdb.update({msg:reaction.message.id,channel:reaction.message.channel.id}, {$set: {upvote:count, score : score}});
    }else if (emoji === "⬇") {
        var meme = await memesdb.findOne({msg:reaction.message.id,channel:reaction.message.channel.id});
        var score = meme.upvote - count;
        var diff = score - meme.score;
        await userdb.update({user:reaction.message.author.id, server: reaction.message.guild.id}, {$inc:{score:diff}});
        await memesdb.update({msg:reaction.message.id,channel:reaction.message.channel.id}, {$set: {downvote:count, score : score}});
    }
});

common.client.on("messageDelete", async(msg) => {
    var meme = await memesdb.findOne({msg:msg.id,channel:msg.channel.id,server:msg.guild.id});
    if(meme == null)
        return;
    //console.log(meme);
    var changeScoreBy = -meme.score;
    await userdb.update({user:msg.author.id, server: msg.guild.id}, {$inc:{score:changeScoreBy}});
    await memesdb.remove({msg:msg.id,channel:msg.channel.id,server:msg.guild.id});
});

common.client.on("guildMemberAdd", async(member) => {
    console.log(member);
    if(member.user == common.client.user)
        console.log("joined " + member.guild.name)
});
common.client.on("guildMemberRemove", async(member) => {
    if(member.user == common.client.user)
        console.log("left " + member.guild.name)
});

common.client.on('messageCreate', async(msg) => {

    if(msg.author == common.client.user)
        return;

    prefix = await purpledb.findOne({server: msg.guild.id}).catch(console.error);
    prefix = prefix ? prefix.prefix : "-";
        musicId = await musicdb.get("channel").findOne({server: msg.guild.id}).catch(console.error);
        channel = null;
        if(musicId && musicId.channel)
            channel = await common.client.channels.fetch(musicId.channel).catch(console.error);
        
        if(msg.channel == channel) {
            let args = msg.content.split(" ");
            if(!msg.content.startsWith(prefix))
                music.play(msg,args).catch((e) => {throw e});
            await msg.delete().catch(console.log);
        }
    
    try {
        commands.forEach(cmd => {
            let cnp = msg.content.split(" ").shift();
            if(cnp.startsWith(prefix)) {
                let cn = cnp.substring(prefix.length);
                if(!(cmd.aliases.includes(cmd.name)))
                    cmd.aliases.push(cmd.name);
                if(cmd.aliases.includes(cn)) {
                    let args = msg.content.split(" ");
                    args.shift();
                    cmd.run(msg,common.client,args).catch((e) => {
                        msg.reply("You crashed the bot! I would like you to stop with that. \n If you were so nice as to send me the error log, i could try to fix the issue :) \n ```javascript\n" + e.stack + "\n```").then((m) => {
                            common.DeleteIn(m,60);
                            common.DeleteIn(msg,60);
                        });
                    });
                }
            }
        });
    } catch (e) {
        let m = await msg.reply("You crashed the bot! I would like you to stop with that. \n If you were so nice as to send me the error log, i could try to fix the issue :) \n ```javascript\n" + e.stack + "\n```")
        common.DeleteIn(m,60);
    }
});

common.client.login(process.env.TOKEN);
