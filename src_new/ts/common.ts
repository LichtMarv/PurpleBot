import { Client, Intents, Message } from "discord.js";
import monk from "monk";
const db = monk("purplebot:purplebot@server:8550/purplebot", { authSource: "admin" });
const serverInfo = db.get("serverInfo");
const memesdb = db.get("memes");
const userdb = db.get("memeUsers");
const deletedb = db.get("deletemsg");

const client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'], intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES] });


function getCollection(collection: string) {
    if (db._state != "open")
        throw Error("Monk not ready yet!");
    return db.get(collection);
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

export {
    serverInfo,
    memesdb,
    userdb,
    deletedb,
    client,
    getCollection,
    DeleteIn,
    setServerInfo,
    getServerInfo
}