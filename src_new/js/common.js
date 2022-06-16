"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shuffle = exports.getServerInfo = exports.setServerInfo = exports.DeleteIn = exports.getCollection = exports.client = exports.deletedb = exports.userdb = exports.memesdb = exports.serverInfo = void 0;
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
const client = new discord_js_1.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'], intents: [discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, discord_js_1.Intents.FLAGS.GUILD_MESSAGES, discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES] });
exports.client = client;
function getCollection(collection) {
    if (db._state != "open")
        throw Error("Monk not ready yet!");
    return db.get(collection);
}
exports.getCollection = getCollection;
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
