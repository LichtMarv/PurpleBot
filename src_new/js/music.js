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
exports.getPause = exports.togglePause = exports.toggleLoop = exports.shiftQueue = exports.CreateEmbed = exports.showQueue = exports.stopMusic = exports.requestSong = void 0;
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
const play_dl_1 = __importStar(require("play-dl"));
const buttons_1 = require("./buttons");
const common = __importStar(require("./common"));
const AsciiTable = require("ascii-table");
const toHHMMSS = function (i) {
    var sec_num = parseInt(i, 10); // don't forget the second param
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    let nhours = hours.toString();
    let nminutes = minutes.toString();
    let nseconds = seconds.toString();
    if (hours < 10) {
        nhours = "0" + hours;
    }
    if (minutes < 10) {
        nminutes = "0" + minutes;
    }
    if (seconds < 10) {
        nseconds = "0" + seconds;
    }
    return nhours + ':' + nminutes + ':' + nseconds;
};
let players = {};
async function searchVideo(name) {
    try {
        const res = await play_dl_1.default.search(name, { source: { youtube: "video" } });
        return res[0].url;
    }
    catch {
        return "";
    }
}
async function addToQueue(guild, songs) {
    let server = await common.getServerInfo(guild);
    let queue = server.musicQueue;
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
async function shiftQueue(guild) {
    let si = await common.getServerInfo(guild);
    if (si.musicLoop && si.musicQueue) {
        await common.serverInfo.update({ server: guild }, { $push: { musicQueue: si.musicQueue[0] } });
    }
    await common.serverInfo.update({ server: guild }, { $pop: { musicQueue: -1 } });
    if (si.musicQueue)
        playSong(guild);
}
exports.shiftQueue = shiftQueue;
async function playSong(guild) {
    let queue = (await common.getServerInfo(guild)).musicQueue;
    if (!queue)
        return;
    let song = queue[0];
    if (song == undefined) {
        return;
    }
    let ytStream;
    try {
        ytStream = await play_dl_1.default.stream(song.url);
    }
    catch {
        shiftQueue(guild);
        return;
    }
    const res = (0, voice_1.createAudioResource)(ytStream.stream, {
        inputType: ytStream.type
    });
    if (!players[guild]) {
        return;
    }
    players[guild].play(res);
    showQueue(guild);
}
async function connect(channel) {
    let guild = channel.guild.id;
    if ((0, voice_1.getVoiceConnection)(guild)) {
        if ((0, voice_1.getVoiceConnection)(guild)?.state.status == voice_1.VoiceConnectionStatus.Disconnected) {
            console.log("bot already disconnected");
        }
        else {
            return (0, voice_1.getVoiceConnection)(guild);
        }
    }
    const connection = (0, voice_1.joinVoiceChannel)({
        channelId: channel.id,
        guildId: guild,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });
    connection.on(voice_1.VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
        try {
            await Promise.race([
                (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Signalling, 5000),
                (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Connecting, 5000),
            ]);
            // Seems to be reconnecting to a new channel - ignore disconnect
        }
        catch (error) {
            // Seems to be a real disconnect which SHOULDN'T be recovered from
            connection.destroy();
            delete players[guild];
        }
    });
    players[guild] = (0, voice_1.createAudioPlayer)();
    players[guild].on(voice_1.AudioPlayerStatus.Idle, () => {
        shiftQueue(guild);
    });
    connection.subscribe(players[guild]);
    playSong(guild);
}
async function disconnect(guild) {
    let vs = (0, voice_1.getVoiceConnection)(guild);
    if (vs) {
        vs.destroy();
        delete players[guild];
    }
    await common.setServerInfo(guild, { musicQueue: [] });
    showQueue(guild);
}
async function getInputType(input) {
    if (input.startsWith('https') && (0, play_dl_1.yt_validate)(input) === 'video') {
        return "video";
    }
    else if (input.startsWith('https') && (0, play_dl_1.yt_validate)(input) === 'playlist') {
        return "playlist";
    }
    else {
        return "name";
    }
}
async function requestSong(input, channel) {
    if (!(0, voice_1.getVoiceConnection)(channel.guild.id))
        await connect(channel);
    const t = await getInputType(input);
    let songs = [];
    if (t == "name")
        songs = [{ url: await searchVideo(input), from: "youtube" }];
    else if (t == "video") {
        songs = [{ url: input, from: "youtube" }];
    }
    else if (t == "playlist") {
        let pl = await (0, play_dl_1.playlist_info)(input, { incomplete: true });
        let nextHundred = await pl.page(1);
        let nextSongs = [];
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
exports.requestSong = requestSong;
async function showQueue(guild) {
    console.log("show queue");
    let server = await common.getServerInfo(guild);
    let musicQueue = server.musicQueue;
    let current = musicQueue[0];
    let urls = [];
    if (current) {
        for (let i = 0; i < musicQueue.length; i++) {
            const element = musicQueue[i];
            urls.push(element.url);
        }
        loadSongs(guild, urls, server);
    }
    else {
        postQueue(guild, {}, server);
    }
}
exports.showQueue = showQueue;
async function loadSongs(guild, urls, server) {
    let infos = {};
    let songCounter = urls.length;
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        (0, play_dl_1.video_basic_info)(url).then((data) => {
            infos[url] = data;
            songCounter--;
            if (songCounter <= 0) {
                postQueue(guild, infos, server);
            }
        });
    }
}
async function postQueue(guild, infos, server) {
    console.log("postQueue ...");
    let musicQueue = server.musicQueue;
    let current = musicQueue[0];
    let row = await (0, buttons_1.buildRow)("musicRow", guild);
    let embed = await CreateEmbed(guild, server);
    let c = await common.client.channels.fetch(server.musicChannel).catch(console.log);
    let m = await c.messages.fetch(server.musicMessage).catch(console.log);
    if (!m || !(m instanceof discord_js_1.Message)) {
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
                info = await (0, play_dl_1.video_basic_info)(element.url);
            let title = info.video_details.title;
            if (title?.length > 40)
                title = title?.slice(0, 40).concat('...');
            table.addRow(i, title, toHHMMSS(info.video_details.durationInSec.toString()));
        }
        await m.edit({ content: "​\n```hs\n" + table.toString() + "```", embeds: [embed], components: [row] });
    }
    else {
        await m.edit({ content: "​\n__Queue empty__", embeds: [embed], components: [row] });
    }
}
async function CreateEmbed(guild, server) {
    let musicQueue = server.musicQueue;
    let current = musicQueue[0];
    let title = undefined;
    let thumbNail = undefined;
    if (current) {
        let info = await (0, play_dl_1.video_basic_info)(current.url);
        title = ("[" + toHHMMSS(info.video_details.durationInSec.toString()) + "]") + info.video_details.title;
        if (title.length > 40) {
            title = title.slice(0, 40).concat('...');
        }
        thumbNail = info.video_details.thumbnails[info.video_details.thumbnails.length - 1];
    }
    let loop = (await common.getServerInfo(guild)).musicLoop;
    let embed = new discord_js_1.MessageEmbed()
        .setTitle(title ? title : "Purple Music")
        .setColor(0x693068)
        .setDescription("Requested by someone")
        .setImage(thumbNail ? thumbNail.url : "https://i.imgur.com/aMyAUlp.png")
        .setFooter({ text: (musicQueue ? musicQueue.length : 0) + " songs in queue | " + (loop ? "looping" : "not looping") });
    if (current)
        embed.setURL(current.url);
    return embed;
}
exports.CreateEmbed = CreateEmbed;
async function toggleLoop(guild) {
    let server = await common.getServerInfo(guild);
    let loop = server.musicLoop;
    if (loop == undefined) {
        loop = true;
    }
    await common.setServerInfo(guild, { musicLoop: !loop });
    showQueue(guild);
}
exports.toggleLoop = toggleLoop;
async function togglePause(guild, vc, set = undefined) {
    if (players[guild] == undefined) {
        await connect(vc);
    }
    else if ((0, voice_1.getVoiceConnection)(guild)?.state.status == voice_1.VoiceConnectionStatus.Ready && (await (await common.client.guilds.fetch(guild)).members.fetch(common.client.user?.id)).voice.channel != vc)
        return false;
    let cur = undefined;
    if (set)
        cur = !set;
    else
        cur = players[guild].state.status == voice_1.AudioPlayerStatus.Paused;
    if (cur)
        players[guild].unpause();
    else
        players[guild].pause(true);
    return true;
}
exports.togglePause = togglePause;
async function getPause(guild) {
    if (players[guild] == undefined) {
        return false;
    }
    let cur = players[guild].state.status == voice_1.AudioPlayerStatus.Paused;
    return cur;
}
exports.getPause = getPause;
async function stopMusic(guild) {
    disconnect(guild);
}
exports.stopMusic = stopMusic;
