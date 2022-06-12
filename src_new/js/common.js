"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteIn = exports.getCollection = exports.client = void 0;
const discord_js_1 = require("discord.js");
const monk_1 = __importDefault(require("monk"));
const db = (0, monk_1.default)("purplebot:purplebot@server:8550/purplebot", { authSource: "admin" });
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
