import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, entersState, getVoiceConnection, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import { Message, MessageEmbed, TextChannel, VoiceChannel } from "discord.js";
import play, { InfoData, playlist_info, video_basic_info, video_info, yt_validate } from "play-dl";
import { buildRow } from "./buttons";
import * as common from "./common"
const AsciiTable = require("ascii-table");

type song = {
    from: "youtube" | "spotify" | "playlist",
    url: string,
}


const toHHMMSS = function (i: string) {
    var sec_num = parseInt(i as string, 10); // don't forget the second param
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    let nhours = hours.toString();
    let nminutes = minutes.toString();
    let nseconds = seconds.toString();

    if (hours < 10) { nhours = "0" + hours; }
    if (minutes < 10) { nminutes = "0" + minutes; }
    if (seconds < 10) { nseconds = "0" + seconds; }
    return nhours + ':' + nminutes + ':' + nseconds;
}


let players: { [guild: string]: AudioPlayer } = {}

async function searchVideo(name: string) {
    try {
        const res = await play.search(name, { source: { youtube: "video" } });
        return res[0].url;
    } catch {
        return "";
    }
}


async function addToQueue(guild: string, songs: song[]) {
    let server = await common.getServerInfo(guild);
    let queue: [] = server.musicQueue;
    if (queue == undefined) {
        await common.setServerInfo(guild, { musicQueue: songs });
        playSong(guild);
    }
    else if (queue.length == 0) {
        let cur = songs.shift();
        await common.serverInfo.update({ server: guild }, { $push: { musicQueue: cur } });
        await playSong(guild);
        common.serverInfo.update({ server: guild }, { $push: { musicQueue: { $each: songs } } });
    }
    else {
        await common.serverInfo.update({ server: guild }, { $push: { musicQueue: { $each: songs } } });
        showQueue(guild);
    }
    //updateQueue(guild);
}

async function shiftQueue(guild: string) {
    let si = await common.getServerInfo(guild);
    if (si.musicLoop && si.musicQueue) {
        await common.serverInfo.update({ server: guild }, { $push: { musicQueue: si.musicQueue[0] } });
    }
    await common.serverInfo.update({ server: guild }, { $pop: { musicQueue: -1 } });
    if (si.musicQueue)
        playSong(guild);
}

async function playSong(guild: string) {
    let queue = (await common.getServerInfo(guild)).musicQueue;
    if (!queue)
        return;
    let song = queue[0];
    if (song == undefined) {
        return;
    }

    let ytStream;
    try {
        ytStream = await play.stream(song.url);
    } catch {
        shiftQueue(guild);
        return;
    }
    const res = createAudioResource(ytStream.stream, {
        inputType: ytStream.type
    });
    if (!players[guild]) {
        return;
    }
    players[guild].play(res);
    showQueue(guild);
}

async function connect(channel: VoiceChannel) {
    let guild = channel.guild.id;

    if (getVoiceConnection(guild)) {
        if (getVoiceConnection(guild)?.state.status == VoiceConnectionStatus.Disconnected) {
            console.log("bot already disconnected");
        } else {
            return getVoiceConnection(guild);
        }
    }
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: guild,
        adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
    });

    connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
            // Seems to be reconnecting to a new channel - ignore disconnect
        } catch (error) {
            // Seems to be a real disconnect which SHOULDN'T be recovered from
            connection.destroy();
            delete players[guild];
        }
    });

    players[guild] = createAudioPlayer();
    players[guild].on(AudioPlayerStatus.Idle, () => {
        shiftQueue(guild);
    });
    connection.subscribe(players[guild]);
    playSong(guild);
}

async function disconnect(guild: string) {
    let vs = getVoiceConnection(guild);
    if (vs) {
        vs.destroy()
        delete players[guild];
    }
    await common.setServerInfo(guild, { musicQueue: [] });
    showQueue(guild);
}

async function getInputType(input: string) {
    if (input.startsWith('https') && yt_validate(input) === 'video') {
        return "video";
    } else if (input.startsWith('https') && yt_validate(input) === 'playlist') {
        return "playlist";
    } else {
        return "name";
    }
}

async function requestSong(input: string, channel: VoiceChannel) {
    if (!getVoiceConnection(channel.guild.id))
        await connect(channel);

    const t: string = await getInputType(input);
    let songs: song[] = [];

    if (t == "name")
        songs = [{ url: await searchVideo(input), from: "youtube" }];
    else if (t == "video") {
        songs = [{ url: input, from: "youtube" }];
    }
    else if (t == "playlist") {
        let pl = await playlist_info(input, { incomplete: true });
        let nextHundred = await pl.page(1);
        let nextSongs: song[] = [];
        for (let i = 0; i < nextHundred.length; i++) {
            const ytSong = nextHundred[i];
            nextSongs.push({ url: ytSong.url, from: "youtube" });
        }
        await addToQueue(channel.guild.id, nextSongs);
        nextSongs = [];
        let rest = await pl.all_videos();
        for (let i = nextHundred.length; i < rest.length; i++) {
            const ytSong = rest[i];
            nextSongs.push({ url: ytSong.url, from: "youtube" });
        }
        songs = nextSongs;
    }
    else
        songs = [];

    if (songs.length != 0)
        addToQueue(channel.guild.id, songs);
}

async function showQueue(guild: string) {
    console.log("show queue");
    let server = await common.getServerInfo(guild);
    let musicQueue = server.musicQueue;
    let current = musicQueue[0];
    let urls: string[] = [];
    if (current) {
        for (let i = 0; i < musicQueue.length; i++) {
            const element = musicQueue[i];
            urls.push(element.url);
        }
        loadSongs(guild, urls, server);
    } else {
        postQueue(guild, {}, server);
    }
}

async function loadSongs(guild: string, urls: string[], server: any) {
    let infos: { [id: string]: InfoData } = {};
    let songCounter = urls.length;
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        video_basic_info(url).then((data) => {
            infos[url] = data;
            songCounter--;
            if (songCounter <= 0) {
                postQueue(guild, infos, server);
            }
        });
    }

}

async function postQueue(guild: string, infos: { [id: string]: InfoData }, server: any) {
    console.log("postQueue ...");
    let musicQueue = server.musicQueue;
    let current = musicQueue[0];
    let row = await buildRow("musicRow", guild);
    let embed = await CreateEmbed(guild, server);
    let c: TextChannel = await common.client.channels.fetch(server.musicChannel).catch(console.log) as TextChannel;
    let m = await c.messages.fetch(server.musicMessage).catch(console.log);
    if (!m || !(m instanceof Message)) {
        console.log("shouldn't print, returned from posting queue");
        return;
    }

    if (current) {
        var table = new AsciiTable("The current Queue");
        table.setHeading('#', 'Title', "Duration");
        for (let i = 0; i < musicQueue.length; i++) {
            const element = musicQueue[i];
            if (i > 10)
                break;
            let info = infos[element.url];
            if (!info)
                info = await video_basic_info(element.url);
            let title = info.video_details.title;
            if (title?.length as number > 40)
                title = title?.slice(0, 40).concat('...');
            table.addRow(i, title, toHHMMSS(info.video_details.durationInSec.toString()));
        }
        await m.edit({ content: "​\n```hs\n" + table.toString() + "```", embeds: [embed], components: [row] });
    } else {
        await m.edit({ content: "​\n__Queue empty__", embeds: [embed], components: [row] });
    }

}

async function CreateEmbed(guild: string, server: any) {
    let musicQueue = server.musicQueue;
    let current = musicQueue[0];
    let title = undefined
    let thumbNail = undefined
    if (current) {
        let info = await video_basic_info(current.url);
        title = ("[" + toHHMMSS(info.video_details.durationInSec.toString()) + "]") + info.video_details.title;
        if (title.length > 40) {
            title = title.slice(0, 40).concat('...');
        }
        thumbNail = info.video_details.thumbnails[info.video_details.thumbnails.length - 1];

    }
    let loop = (await common.getServerInfo(guild)).musicLoop;
    let embed = new MessageEmbed()
        .setTitle(title ? title : "Purple Music")
        .setColor(0x693068)
        .setDescription("Requested by someone")
        .setImage(thumbNail ? thumbNail.url : "https://i.imgur.com/aMyAUlp.png")
        .setFooter({ text: (musicQueue ? musicQueue.length : 0) + " songs in queue | " + (loop ? "looping" : "not looping") });
    if (current)
        embed.setURL(current.url);
    return embed
}

async function toggleLoop(guild: string) {
    let server = await common.getServerInfo(guild);
    let loop = server.musicLoop;
    if (loop == undefined) {
        loop = true;
    }
    await common.setServerInfo(guild, { musicLoop: !loop });
    showQueue(guild);
}

async function togglePause(guild: string, vc: VoiceChannel, set: boolean | undefined = undefined) {
    if (players[guild] == undefined) {
        await connect(vc);
    } else if (getVoiceConnection(guild)?.state.status == VoiceConnectionStatus.Ready && (await (await common.client.guilds.fetch(guild)).members.fetch(common.client.user?.id as string)).voice.channel as VoiceChannel != vc)
        return false;
    let cur = undefined;
    if (set)
        cur = !set;
    else
        cur = players[guild].state.status == AudioPlayerStatus.Paused;
    if (cur)
        players[guild].unpause();
    else
        players[guild].pause(true);
    return true;
}

async function getPause(guild: string) {
    if (players[guild] == undefined) {
        return false;
    }
    let cur = players[guild].state.status == AudioPlayerStatus.Paused;
    return cur;
}

async function stopMusic(guild: string) {
    disconnect(guild);
}

export {
    requestSong,
    stopMusic,
    showQueue,
    CreateEmbed,
    shiftQueue,
    toggleLoop,
    togglePause,
    getPause,
}