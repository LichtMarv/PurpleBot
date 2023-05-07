import { Client, IntentsBitField, Message, Partials } from "discord.js";
import monk from "monk";
const db = monk("purplebot:purplebot@server:8550/purplebot", { authSource: "admin" });
const serverInfo = db.get("serverInfo");
const memesdb = db.get("memes");
const userdb = db.get("memeUsers");
const deletedb = db.get("deletemsg");

enum LogDataType {
    MSG,
    ERR,
}

const client = new Client({ partials: [Partials.Message, Partials.Channel, Partials.Reaction], intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessageReactions, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent, IntentsBitField.Flags.GuildVoiceStates] });


function getCollection(collection: string) {
    if (db._state != "open")
        throw Error("Monk not ready yet!");
    return db.get(collection);
}

function dateFormat(date: Date, fstr: string) {
    return fstr.replace(/%[YymdHMS]/g, function (m) {
        switch (m) {
            case '%Y': return date.getFullYear().toString(); // no leading zeros required
            case '%y': return date.getFullYear().toString().slice(-2);
            case '%m': m = (1 + date.getMonth()).toString(); break;
            case '%d': m = date.getDate().toString(); break;
            case '%H': m = date.getHours().toString(); break;
            case '%M': m = date.getMinutes().toString(); break;
            case '%S': m = date.getSeconds().toString(); break;
            default: return m.slice(1); // unknown code, remove %
        }
        // add leading zero if required
        return ('0' + m).slice(-2);
    });
}

async function Log(guildId: string, type: LogDataType, msg: string) {
    let serverInfo = await getServerInfo(guildId);
    let log: [{ type: LogDataType, msg: string, time: number }] = serverInfo.log
    if (log) {
        let len = log.push({ type: type, msg: msg, time: Date.now() });
        if (len > 1000) log.shift();
    } else {
        log = [{ type: type, msg: msg, time: Date.now() }]
    }

    await setServerInfo(guildId, { "log": log })
}

async function DeleteIn(msg: Message, timeout: number) {
    //console.log(msg.content);
    var time = Date.now() + timeout * 1000;
    await db.get("deletemsg").insert({ server: msg.guild?.id, channel: msg.channel.id, msg: msg.id, timeout: time }).catch(console.error);
}

async function setServerInfo(guild: string, params: { [name: string]: any }) {
    let cur = await serverInfo.findOne({ server: guild });
    if (cur) {
        cur = await serverInfo.update({ server: guild }, { $set: params });
        console.log(cur);
    } else {
        let tmp = params;
        tmp["server"] = guild;
        await serverInfo.insert(tmp);
    }
}

async function getServerInfo(guild: string) {
    let cur = await serverInfo.findOne({ server: guild });
    if (cur) {
        return cur;
    } else {
        await serverInfo.insert({ server: guild });
        let cur = await serverInfo.findOne({ server: guild });
        return cur;
    }
}

async function shuffle(array: any[]) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

export {
    serverInfo,
    memesdb,
    userdb,
    deletedb,
    client,
    getCollection,
    DeleteIn,
    setServerInfo,
    getServerInfo,
    shuffle,
    Log,
    dateFormat,
    LogDataType
}