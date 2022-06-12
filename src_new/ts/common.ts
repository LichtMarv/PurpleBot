import { Client, Intents, Message } from "discord.js";
import monk from "monk";
const db = monk("purplebot:purplebot@server:8550/purplebot", { authSource: "admin" });

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

export {
    client,
    getCollection,
    DeleteIn
}