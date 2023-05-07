"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogDataType = exports.dateFormat = exports.Log = exports.shuffle = exports.getServerInfo = exports.setServerInfo = exports.DeleteIn = exports.getCollection = exports.client = exports.deletedb = exports.userdb = exports.memesdb = exports.serverInfo = void 0;
const discord_js_1 = require("discord.js");
const monk_1 = __importDefault(require("monk"));
const db = (0, monk_1.default)("purplebot:purplebot@server:8550/purplebot", { authSource: "admin" });
const serverInfo = db.get("serverInfo");
exports.serverInfo = serverInfo;
const memesdb = db.get("memes");
exports.memesdb = memesdb;
const userdb = db.get("memeUsers");
exports.userdb = userdb;
const deletedb = db.get("deletemsg");
exports.deletedb = deletedb;
var LogDataType;
(function (LogDataType) {
    LogDataType[LogDataType["MSG"] = 0] = "MSG";
    LogDataType[LogDataType["ERR"] = 1] = "ERR";
})(LogDataType || (LogDataType = {}));
exports.LogDataType = LogDataType;
const client = new discord_js_1.Client({ partials: [discord_js_1.Partials.Message, discord_js_1.Partials.Channel, discord_js_1.Partials.Reaction], intents: [discord_js_1.IntentsBitField.Flags.Guilds, discord_js_1.IntentsBitField.Flags.GuildMessageReactions, discord_js_1.IntentsBitField.Flags.GuildMessages, discord_js_1.IntentsBitField.Flags.MessageContent, discord_js_1.IntentsBitField.Flags.GuildVoiceStates] });
exports.client = client;
function getCollection(collection) {
    if (db._state != "open")
        throw Error("Monk not ready yet!");
    return db.get(collection);
}
exports.getCollection = getCollection;
function dateFormat(date, fstr) {
    return fstr.replace(/%[YymdHMS]/g, function (m) {
        switch (m) {
            case '%Y': return date.getFullYear().toString(); // no leading zeros required
            case '%y': return date.getFullYear().toString().slice(-2);
            case '%m':
                m = (1 + date.getMonth()).toString();
                break;
            case '%d':
                m = date.getDate().toString();
                break;
            case '%H':
                m = date.getHours().toString();
                break;
            case '%M':
                m = date.getMinutes().toString();
                break;
            case '%S':
                m = date.getSeconds().toString();
                break;
            default: return m.slice(1); // unknown code, remove %
        }
        // add leading zero if required
        return ('0' + m).slice(-2);
    });
}
exports.dateFormat = dateFormat;
async function Log(guildId, type, msg) {
    let serverInfo = await getServerInfo(guildId);
    let log = serverInfo.log;
    if (log) {
        let len = log.push({ type: type, msg: msg, time: Date.now() });
        if (len > 1000)
            log.shift();
    }
    else {
        log = [{ type: type, msg: msg, time: Date.now() }];
    }
    await setServerInfo(guildId, { "log": log });
}
exports.Log = Log;
async function DeleteIn(msg, timeout) {
    //console.log(msg.content);
    var time = Date.now() + timeout * 1000;
    await db.get("deletemsg").insert({ server: msg.guild?.id, channel: msg.channel.id, msg: msg.id, timeout: time }).catch(console.error);
}
exports.DeleteIn = DeleteIn;
async function setServerInfo(guild, params) {
    let cur = await serverInfo.findOne({ server: guild });
    if (cur) {
        cur = await serverInfo.update({ server: guild }, { $set: params });
        console.log(cur);
    }
    else {
        let tmp = params;
        tmp["server"] = guild;
        await serverInfo.insert(tmp);
    }
}
exports.setServerInfo = setServerInfo;
async function getServerInfo(guild) {
    let cur = await serverInfo.findOne({ server: guild });
    if (cur) {
        return cur;
    }
    else {
        await serverInfo.insert({ server: guild });
        let cur = await serverInfo.findOne({ server: guild });
        return cur;
    }
}
exports.getServerInfo = getServerInfo;
async function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }
    return array;
}
exports.shuffle = shuffle;
