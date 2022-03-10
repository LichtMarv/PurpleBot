const db = require("monk")(process.env.DB);
const Discord = require("discord.js");
const musicdb = require("monk")(process.env.MUSIC,{authSource:'admin'});
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'], intents: [Discord.Intents.FLAGS.GUILDS , Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS , Discord.Intents.FLAGS.GUILD_MESSAGES,Discord.Intents.FLAGS.GUILD_VOICE_STATES ] });



module.exports = {
    db,musicdb,

    DeleteIn: async function(msg, timeout) {
    //console.log(msg.content);
    var time = Date.now() + timeout*1000;
    await db.get("deletemsg").insert({server: msg.guild.id, channel: msg.channel.id, msg: msg.id, timeout: time}).catch(console.error);
    },
    client:client,
    sleep: async function(ms) {
        return new Promise(resolve => setTimeout(resolve,ms));
    },
    isInt: async function (value) {
        return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
    },
    shuffle: async function(array) {
        let currentIndex = array.length,  randomIndex;
      
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
}