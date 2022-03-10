const { Channel } = require("discord.js");
const Discord = require("discord.js");
const AsciiTable = require("ascii-table");
const common = require("./common.js");
const db = common.db;
const musicdb = common.musicdb;
const purpledb = db.get("prefix");
const memesdb = db.get("memes");
const userdb = db.get("memeUsers");
const music = require("./music.js");

cmd = [
    {
        name:"help",
        aliases:["h","help"],
        description:"Basic information for all commands",
        run: async function(msg,client,args) {
            var table = new AsciiTable("Command Help");
            //table.setHeading('Name', 'Aliases', 'Description');
            const embed = new Discord.MessageEmbed()
                .setTitle("HELP")
                .setColor(0xf5cd07);
            for (let i = 0; i < cmd.length; i++) { 
                var c = cmd[i];
                embed.addField(c.name + " - " + c.aliases.toString(),c.description);
                //table.addRow(c.name, c.aliases.toString(), c.description);
            }
            //console.log(table.toString());
            var response = await msg.channel.send({embeds: [embed]});
            await common.DeleteIn(response,60);
            await common.DeleteIn(msg,60);
        }
    },
    {
        name:"ping",
        aliases:["pg"],
        description:"shows you your ping (may be influenced heavily by my internet xD)",
        run: async function(msg,client,args) {
            await msg.channel.send(`Pong! ${Date.now() - msg.createdTimestamp}ms. API: ${Math.round(client.ws.ping)}ms`) 
        }
    },
    {
        name:"setup",
        aliases:["setupmusic","musicsetup","mssetup"],
        description:"Setup the Music Channel",
        run: async function(msg,client,args) {
            console.log("setup ...");
            let server = await musicdb.get("channel").findOne({server: msg.guild.id});
            let channel = false;
            if(server) {
                if(server.channel)
                    channel = await client.channels.fetch(server.channel).catch(console.error);
                if(!channel) {
                    musicdb.get("channel").remove({server: msg.guild.id});
                }
            }
            if(channel) {
                console.log(channel.name);
                msg.channel.send(`channel already exists : <#${channel.id}>`)
            }else {
                let newChannel = await msg.guild.channels.create("🎵┃Purple Music");
                const embed = await music.createEmbed();
                await newChannel.send({files:[new Discord.MessageAttachment("banner.png")]});
                let mymsg = await newChannel.send({content:"​\n__Queue empty__", embeds: [embed]});
                let up = await musicdb.get("channel").insert({server: msg.guild.id, channel: newChannel.id, message: mymsg.id});
                msg.channel.send(`created channel <#${newChannel.id}>`)
            }
        }
    },
    {
        name:"prefix",
        aliases:["pf","changepf"],
        description:"Changes the standard prefix",
        run: async function(msg,client,args) {
            //console.log(args);
            prefix = await purpledb.findOne({server: msg.guild.id});
            if(prefix) {
                await purpledb.update({server: msg.guild.id},{$set: {prefix: args[0]}});
                msg.channel.send(`changed prefix to ${args[0]}`)
            }else {
                await purpledb.insert({server: msg.guild.id, prefix: args[0]});
                msg.channel.send(`updated prefix to ${args[0]}`)
            }
        }
    },
    {
        name:"m",
        aliases:["meme"],
        description:"Marks a message as a meme for the bot",
        run: async function(msg,client,args) {
            if(args.length <= 0) {
                return;
            }
            console.log("New message marked on " + msg.guild.name);
            await memesdb.insert({server:msg.guild.id, msg : msg.id, channel: msg.channel.id, author: msg.author.id,score: 0, upvote : 1, downvote : 1, time: Date.now()});
            var user = await userdb.findOne({server:msg.guild.id, user:msg.author.id});
            if(user == null) {
                await userdb.insert({user:msg.author.id,server:msg.guild.id, score:0});
            }

            await msg.react("⬆");
            await msg.react("⬇");
        }
    },
    {
        name:"leaderboard",
        aliases:["lb","toplist","top","tl"],
        description:"List of the highest voted memes",
        run: async function(msg,client,args) {
            console.log("Leaderboard requested on " + msg.guild.name);
            var days = args[0] ? args[0] : 7;
            if(days == -1 || days == "alltime")
                var memes = await memesdb.find({ server : msg.guild.id},{ limit : 10, sort : {score : -1 , time : 1 } });
            else
                var memes = await memesdb.find({ server : msg.guild.id, time:{$gte:Date.now() - 86400000*days}},{ limit : 10, sort : {score : -1 , time : 1 } });

            if(days == -1 || days == "alltime")
                var table = new AsciiTable("Top Memes Of All Time"); 
            else
                var table = new AsciiTable("Top Memes " + days + " Days");
            table.setHeading('#', '⬆', 'Author');
            for (let i = 0; i < memes.length; i++) {
                const meme = memes[i];
                var channel =  await client.channels.fetch(meme.channel);
                var memeMsg = await channel.messages.fetch(meme.msg);
                table.addRow(i+1, meme.upvote - meme.downvote, memeMsg.author.username);
            }
            //table.setBorder('|','');
            // const embed = new Discord.MessageEmbed()
            //     .setTitle('test embed')
            //     .setColor(0xf5cd07)
            //     .setDescription("```\n" + table.toString() + "```");
            var response = await msg.channel.send("```hs\n" + table.toString() + "```");
            await common.DeleteIn(response,60);
            await common.DeleteIn(msg,60);
        }
    },
    {
        name:"topmemers",
        aliases:["topplayers","topmemer"],
        description:"Shows the users with the highest vote score",
        run: async function(msg,client,args) {
            var users = await userdb.find({ server : msg.guild.id}, {limit: 5, sort : {score : -1} });
            var table = new AsciiTable("Top Memers Of All Time");
            //console.log(Date.now());
            table.setHeading('#', '⬆', 'Memer','Award');
            var awards = ["Gigachad","Big Chungus","Meme Man"];
            for (let i = 0; i < users.length; i++) {
                var user = users[i];
                var member = await msg.guild.members.fetch(user.user);
                table.addRow(i+1, user.score, member.user.username,awards[i]);
            }
            var response = await msg.channel.send("```hs\n" + table.toString() + "```");
            await common.DeleteIn(response,60);
            await common.DeleteIn(msg,60);
        }
    },
    {
        name:"position",
        aliases:["pos"],
        description:"Message link of place in the toplist",
        run: async function(msg,client,args) {
            var days = args[1] ? args[1] : 7;
            if(days == -1 || days == "alltime")
                var memes = await memesdb.find({ server : msg.guild.id},{ limit : 10, sort : {score : -1 , time : 1 } });
            else
                var memes = await memesdb.find({ server : msg.guild.id, time:{$gte:Date.now() - 86400000*days}},{ limit : 10, sort : {score : -1 , time : 1 } });
            var index = args[0] - 1;
            var channel =  await client.channels.fetch(memes[index].channel);
            var memeMsg = await channel.messages.fetch(memes[index].msg);
            const embed = new Discord.MessageEmbed()
                .setTitle('Here is the link to meme #' + args[0])
                .setColor(0xf5cd07)
                .setDescription("[Link](" + memeMsg.url +")")
                //.setURL(memeMsg.url)
            var response = await msg.channel.send(embed);
            await common.DeleteIn(response,60);
            await common.DeleteIn(msg,60);
        }
    },
    {
        name:"getmeme",
        aliases:["get"],
        description:"Message link + preview of marked message",
        run: async function(msg,client,args) {
            var days = args[1] ? args[1] : 7;
            if(days == -1 || days == "alltime")
                var memes = await memesdb.find({ server : msg.guild.id},{ limit : 10, sort : {score : -1 , time : 1 } });
            else
                var memes = await memesdb.find({ server : msg.guild.id, time:{$gte:Date.now() - 86400000*days}},{ limit : 10, sort : {score : -1 , time : 1 } });
            var index = args[0] - 1;
            var channel =  await client.channels.fetch(memes[index].channel);
            var memeMsg = await channel.messages.fetch(memes[index].msg);
            //console.log("get command used! " + memeMsg.content.split(" ")[1] + " | " + memeMsg.url);
            const embed = new Discord.MessageEmbed()
                .setTitle('Here is the link to meme #' + args[0])
                .setColor(0xf5cd07)
                .setDescription("[Go to Meme](" + memeMsg.url +")")
            var response1 = await msg.channel.send(embed);
            var response2 = await msg.channel.send(memeMsg.content.split(" ")[1]);
            await common.DeleteIn(response1,60);
            await common.DeleteIn(msg,60);
            await common.DeleteIn(response2,60);
        }
    },
    {
        name:"spotify",
        aliases:["sp"],
        description: "the ultimate spotify integration",
        run: async function(msg,client,args) {
            console.log("spotify");
            msg.channel.send("if you want to listen to spotify, get good os: \n https://github.com/abba23/spotify-adblock");
        }
    },
    {
        name:"play",
        aliases:["pl"],
        description: "Play a song. you can paste a youtube link directly or just type the name",
        run: async function(msg,client,args) {
            console.log("play");
            music.play(msg,args).catch((e) => {throw e});
        }
    },
    {
        name:"stop",
        aliases:["sp","leave"],
        description: "Stop the music queue and leve channel",
        run: async function(msg,client,args) {
            console.log("stop");
            await music.stop(msg.guild);
        }
    },
    {
        name:"skip",
        aliases:["sk"],
        description: "Skip current song",
        run: async function(msg,client,args) {
            console.log("skip");
            await music.skip(msg,args);
        }
    },
    {
        name:"move",
        aliases:["mv"],
        description: "Move specified song to the top of the queue",
        run: async function(msg,client,args) {
            console.log("move");
            await music.move(msg,args);
        }
    }
    ,
    {
        name:"pause",
        aliases:[],
        description: "Pauses the current song",
        run: async function(msg,client,args) {
            console.log("pause");
            await music.pause(msg,args);
        }
    },
    {
        name:"resume",
        aliases:[],
        description: "Resume current song",
        run: async function(msg,client,args) {
            console.log("resume");
            await music.resume(msg,args);
        }
    },
    {
        name:"loop",
        aliases:[],
        description: "Toggle playlist looping",
        run: async function(msg,client,args) {
            console.log("loop toggle");
            await music.enloop(msg,args);
        }
    },
    {
        name:"shuffle",
        aliases:[],
        description: "Shuffle the Queue",
        run: async function(msg,client,args) {
            console.log("shuffle");
            await music.shuffleQ(msg,args);
        }
    },
    {
        name:"clear",
        aliases:[],
        description: "clears the Queue",
        run: async function(msg,client,args) {
            console.log("clear queue");
            await music.clear(msg,args);
        }
    },
    {
        name:"queue",
        aliases:[],
        description: "Show current queue",
        run: async function(msg,client,args) {
            console.log("queue");
            await music.queue(msg,args);
        }
    }
    // {
    //     name:"updatedb",
    //     aliases:["udb"],
    //     run: async function(msg,client,args) {
    //         var memes = await memesdb.find({ server : msg.guild.id},{sort : {score : -1 , time : 1 } });
    //         var userScores = {};
    //         for(const meme of memes) {
    //             var channel =  await client.channels.fetch(meme.channel);
    //             var guild = channel.guild;
    //             var author = await guild.members.fetch(meme.author);
    //             var score = meme.upvote - meme.downvote;
    //             var user = author.id;
    //             console.log(user, score)
    //             if(userScores[user])
    //                 userScores[user] += score;
    //             else
    //                 userScores[user] = score;
    //         }
    //         var topList = [];
    //         for (const [key, value] of Object.entries(userScores)) {
    //             topList.push({user:key,score:value});
    //         }
    //         for (let i = 0; i < topList.length; i++) {
    //             const entry = topList[i];
    //             var entryname = entry.user;
    //             console.log(entry.user, entry.score);
    //             await userdb.insert({user:entry.user, server:msg.guild.id , score:entry.score})
    //         }
            
    //     }
    // },
    
]


module.exports=cmd;
