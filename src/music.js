const {joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	entersState,
    NoSubscriberBehavior,
	StreamType,
	AudioPlayerStatus,
	VoiceConnectionStatus,
    getVoiceConnection, 
    VoiceConnection} = require("@discordjs/voice")
const playdl = require("play-dl")
const AsciiTable = require("ascii-table");
const Discord = require("discord.js");
const common = require("./common.js");
const timer = require("./timer.js")
const musicdb = common.musicdb;

/* player = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
    }
}); */

const sleepTime = 2;

players = {}
info_cache = []

async function cacheInfo(url) {
    if(url == undefined)
        return
    try {
        let info = await playdl.video_info(url);
        length = info_cache.push({url: url, info: info});
        if(length > 20)
            info_cache.shift();
    } catch (e) {
        console.log("Error on " + url + " - " + e.toString());
    }
}

async function getCachedInfo(url) {
    for (let i = 0; i < info_cache.length; i++) {
        const element = info_cache[i];
        if(element.url == url)
            return element.info;
    }
    return undefined;
}

async function addToQueue(server, urls) {
    let queue = await musicdb.get("queue");
    let search = await queue.findOne({server: server});
    if(search == undefined)
        await queue.insert({server: server,loop: false, current: urls[0], list: []});
    else
        await queue.update({server: server}, {$push: {list: urls[0]}});
    for (let i = 1; i < urls.length; i++) {
        const url = urls[i];
        cacheInfo(url);
        //console.log(search);
        await queue.update({server: server}, {$push: {list: url}});
    }
    updateQueue(server);
}

async function getCurrentSong(server) {
    let queue = await musicdb.get("queue");
    let elem = await queue.findOne({server: server});
    if(elem)
        return elem.current;
    else
        return undefined;
}

async function getQueue(server) {
    let queue = await musicdb.get("queue");
    let elem = await queue.findOne({server: server});
    if(elem)
        return elem.list;
    else
        return [];
    
}

async function getNextSong(server) {
    let queue = await musicdb.get("queue");
    let elem = await queue.findOne({server: server});
    if(elem == null)
        return null;
    let url = elem.list[0];
    await queue.update({server: server}, {$pop: {list: -1}});
    await queue.update({server: server}, {$set: {current: url}});
    if(elem.loop) {
        await addToQueue(server,url);
    }
    return url;
}

async function removeNumFromQueue(server,num) {
    let queue = await musicdb.get("queue");
    let elem = await queue.findOne({server: server});
    if(elem.list.length <= num) {
        deleteQueue(server);
    }else {
        elem.list.splice(0,num);
    }
    await queue.update({server: server}, {$set: {list: elem.list}});
}

async function deleteQueue(server) {
    let queue = await musicdb.get("queue");
    let elem = await queue.findOne({server: server});
    await queue.remove({_id: elem._id});
    await updateQueue(server);
}

async function shuffleQueue(server) {
    let queue = await musicdb.get("queue");
    let elem = await queue.findOne({server: server});
    if(elem == null)
        return;
    let l = await common.shuffle(elem.list);
    await queue.update({server: server}, {$set: {list: l}});
    updateQueue(server);
}

async function moveQueue(server,index) {
    let queue = await musicdb.get("queue");
    let elem = await queue.findOne({server: server});
    if(elem == null)
        return;
    if(elem.list.length <= index-1 || index-1 < 1) {
        return;
    }else {
        let e = elem.list[index-1];
        elem.list.unshift(e);
        elem.list.splice(index,1);
        await queue.update({server: server}, {$set: {list: elem.list}});
    }
    showQueue(server);
    
}

async function toggleLoop(server) {
    let queue = await musicdb.get("queue");
    let elem = await queue.findOne({server: server});
    if(elem) {
        let l = elem.loop
        await queue.update({server: server}, {$set: {loop: !l}});
    }
}

async function playSong(server,link) {
    let resource;
    if(players[server] == undefined) {
        players[server] = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause
            }
        });
        player = players[server];
        player.on(AudioPlayerStatus.Idle,() => {
            console.log("Song done ...");
            nextSong(server);
        })
        getVoiceConnection(server).subscribe(player);
    }
    player = players[server];
    
    console.log(link);
    // resource = createAudioResource(await playdl.stream(link), {
    //     inputType: StreamType.Arbitrary,
    //     inlineVolume: true
    // });
    try {
        const source = await playdl.stream(link);
        resource = createAudioResource(source.stream, {
            inputType : source.type
        })
    } catch (e){
        console.log("something wrong: " + e.toString());
        return;
    }
	

    //resource.volume.setVolume(0.1);
    //playdl.attachListeners(player,playdl.stream(link))
	player.play(resource);

	return entersState(player, AudioPlayerStatus.Playing, 5e3);
}

async function showQueue(id) {
    await timer.makeTimer("queue");
    timer.startSection("queue", "currentInfo");
    let current = await getCurrentSong(id);
    let musicQueue = await getQueue(id);
    let cache = await getCachedInfo(current);
    let info = undefined;
    if(cache) {
        info = cache;
    }else {
        cacheInfo(current);
        info = current ? await playdl.video_info(current) : undefined;
    }
    timer.stopSection("queue", "currentInfo");
    
    if(current) {
        timer.startSection("queue", "createTable");
        var table = new AsciiTable("The current Queue");
        //console.log(Date.now());
        table.setHeading('#', 'Title',"Duration");
        let title = info.video_details.title;
        if(title.length > 40)
            title = title.slice(0,40).concat('...');
        table.addRow(0,title,info.video_details.durationInSec.toString().toHHMMSS());
        timer.stopSection("queue", "createTable");
        timer.startSection("queue","forLoop");
        for (let i = 0; i < musicQueue.length; i++) {
            const element = musicQueue[i];
            if(i > 10)
                break;
            await common.sleep(sleepTime);
            let cache = await getCachedInfo(element);
            let info = undefined;
            if(cache) {
                console.log("cached " + element)
                info = cache;
            }else {
                cacheInfo(element);
                info = await playdl.video_info(element)
            }
            //console.log(info.video_details);
            let title = info.video_details.title;
            if(title.length > 40)
                title = title.slice(0,40).concat('...');             

                table.addRow(i+1,title, info.video_details.durationInSec.toString().toHHMMSS());
        }
        timer.stopSection("queue","forLoop");
    }

    timer.startSection("queue","embed");
    //let m = await msg.channel.send("```hs\n" + table.toString() + "```");
    let embed = await CreateEmbed(current, musicQueue, info);
    let server = await musicdb.get("channel").findOne({server: id});
    let c = await common.client.channels.fetch(server.channel).catch(console.log);
    let m = await c.messages.fetch(server.message).catch(console.log);
    if(current)
        await m.edit({content:"​\n```hs\n" + table.toString() + "```", embeds: [embed]});
    else
        await m.edit({content:"​\n__Queue empty__", embeds: [embed]});
    //common.DeleteIn(m,10);
    await timer.stopSection("queue","embed");
    await timer.printTimer("queue");
}

async function CreateEmbed(current, musicQueue, info) {
    let title = null
    let thumbNail = null
    if(current) {
        title = ("[" + info.video_details.durationInSec.toString().toHHMMSS() + "]") + info.video_details.title;
        if(title.length > 40){
            title = title.slice(0,40).concat('...');
        }
        thumbNail = info.video_details.thumbnails[info.video_details.thumbnails.length-1];
            
    }
    let embed = new Discord.MessageEmbed()
        .setTitle(title ? title : "Purple Music")
        .setColor(0x693068)
        .setDescription("Requested by someone")
        //.setURL("https://www.wolframalpha.com/")
        //.setThumbnail("https://images-eu.ssl-images-amazon.com/images/I/41II4YzkFxL.png")
        .setImage(thumbNail ? thumbNail.url : "https://i.imgur.com/aMyAUlp.png")
        .setFooter({text: (musicQueue ? musicQueue.length : 0) + " songs in queue"});
    return embed
}

String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}

async function nextSong(server) {
    let link = await getNextSong(server);
    if(link) {
        await playSong(server,link);
        showQueue(server);
    }else{
      console.log("pl done");
      await deleteQueue(server);
      updateQueue(server);
    }
}

async function updateQueue(server) {
    console.log(server);
    let player = players[server];
    if(player && player.state.status != AudioPlayerStatus.Idle) {
        showQueue(server);
        return;
    }
    let current = await getCurrentSong(server);
    console.log("playing song ...")
    if(current){
        await playSong(server,current);
        showQueue(server);
    }
    else
        showQueue(server);
    
}

async function getSong(server, url, file) {
    if(!url) {
        await nextSong(server);
        return;
    }
        
    if (url.startsWith('https') && playdl.yt_validate(url) === 'video') {
        // YouTube Video Url.
        addToQueue(server, [url]);
    } else if (url.startsWith('https') && playdl.yt_validate(url) === 'playlist') {
        // YouTube Playlist Url.
        pl = await playdl.playlist_info(url, {incomplete: true});
        vids = await pl.all_videos();
        urls = []
        vids.forEach(vid => {
            urls.push(vid.url);
        });
        addToQueue(server, urls);
    } else {
        vid = await playdl.search(url,{limit: 1});
        vid = vid[0];
        addToQueue(server, [vid.url]);
    }
}

async function reset(server) {
    players[server].removeAllListeners(AudioPlayerStatus.Idle);
    players[server] = undefined;
    if(getVoiceConnection(server))
        getVoiceConnection(server).destroy();
}

async function connectToChannel(channel) {
    server = channel.guild.id;
    

    if(getVoiceConnection(server)) {
        if(getVoiceConnection(server).state.status == VoiceConnectionStatus.Disconnected) {
            await reset(server);
        }else {
            return getVoiceConnection(server);
        }
    }
	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: server,
		adapterCreator: channel.guild.voiceAdapterCreator,
	});
    

	try {
		await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
		return connection;
	} catch (error) {
		connection.destroy();
        console.log("HERE ERROR");
		throw error;
	}
}

module.exports = {

    play: async function(msg,args) {
       //let uc = msg.guild.member(client.user).voice.channel
       let tc = msg.member.voice.channel;
       let att = msg.attachments.values().next().value;
       //console.log(att);
       if(tc) {
           await connectToChannel(tc);
           if(att) {
               if(att.contentType == "audio/mpeg")
                   await getSong(msg.guild.id, att.url, true);
           }else
               await getSong(msg.guild.id, args.join(" "), false);
           //showQueue(msg.guild.id);
           //msg.channel.send("Song added to queue at position: " + (musicQueue.length+1))
           
       } else {
           let m = await msg.reply('You need to join a voice channel first!');
           common.DeleteIn(m,10);
         }
   },

   stop : async function(guild,args) {
        let player = players[guild.id];
        if(player)
            player.stop();
        await reset(guild.id);
        await deleteQueue(guild.id);
   },

   skip : async function(msg,args) {
        /* let player = players[msg.guild.id];
        player.stop(); */
        if(common.isInt(args[0]))
            await removeNumFromQueue(msg.guild.id,args[0]-1)
        await nextSong(msg.guild.id);
   },

   move : async function(msg,args) {
        if(args.length > 0 && common.isInt(args[0]))
            moveQueue(msg.guild.id,args[0]);
       //await checkQueue();
   },

   pause : async function(msg,args) {
       players[msg.guild.id].pause(true);
   },

   resume : async function(msg,args) {
        players[msg.guild.id].unpause();
   },

   shuffleQ : async function(msg,args) {
       await shuffleQueue(msg.guild.id);
   },

   clear : async function(msg,args) {
       await deleteQueue(msg.guild.id);
       players[msg.guild.id].stop();
   },

   enloop : async function(msg,args) {
       await toggleLoop(msg.guild.id);
   },

   queue : async function(msg,args) {
       showQueue(msg.guild.id);
   },

   createEmbed: async function() {
       let embed = await CreateEmbed();
       return embed;
   }

}