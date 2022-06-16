"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRow = exports.rows = exports.btns = void 0;
const discord_js_1 = require("discord.js");
const music_1 = require("./music");
const btns = [
    {
        name: "Pause",
        id: "pause",
        build: async function (guild) {
            let p = await (0, music_1.getPause)(guild);
            return new discord_js_1.MessageButton()
                .setLabel(p ? "Resume" : "Pause")
                .setCustomId(this.id)
                .setEmoji(p ? "▶️" : "⏸️")
                .setStyle("PRIMARY");
        },
        run: async function (interaction) {
            let suc = await (0, music_1.togglePause)(interaction.guildId, interaction.member?.voice?.channel);
            let c = await buildRow("musicRow", interaction.guildId);
            if (!c || !suc)
                return null;
            interaction.update({
                components: [c]
            });
            return null;
        }
    },
    {
        name: "Skip",
        id: "skip",
        build: async function () {
            return new discord_js_1.MessageButton()
                .setLabel(this.name)
                .setCustomId(this.id)
                .setEmoji("⏭️")
                .setStyle("PRIMARY");
        },
        run: async function (interaction) {
            (0, music_1.shiftQueue)(interaction.guildId);
            interaction.deferUpdate();
            return null;
        }
    },
    {
        name: "Clear",
        id: "clear",
        build: async function () {
            return new discord_js_1.MessageButton()
                .setLabel(this.name)
                .setCustomId(this.id)
                .setEmoji("⏹")
                .setStyle("PRIMARY");
        },
        run: async function (interaction) {
            (0, music_1.stopMusic)(interaction.guildId);
            interaction.deferUpdate();
            return null;
        }
    },
    {
        name: "Shuffle",
        id: "shuffle",
        build: async function () {
            return new discord_js_1.MessageButton()
                .setLabel(this.name)
                .setCustomId(this.id)
                .setEmoji("🔀")
                .setStyle("PRIMARY");
        },
        run: async function (interaction) {
            (0, music_1.shuffleQueue)(interaction.guildId);
            interaction.deferUpdate();
            return null;
        }
    },
    {
        name: "Loop",
        id: "loop",
        build: async function (guild) {
            let l = await (0, music_1.getLoop)(guild);
            return new discord_js_1.MessageButton()
                .setLabel(this.name)
                .setCustomId(this.id)
                .setEmoji("🔁")
                .setStyle(l ? "SUCCESS" : "DANGER");
        },
        run: async function (interaction) {
            await (0, music_1.toggleLoop)(interaction.guildId);
            let c = await buildRow("musicRow", interaction.guildId);
            if (!c)
                return null;
            interaction.update({
                components: [c]
            });
            return null;
        }
    },
];
exports.btns = btns;
const rows = {
    musicRow: ["pause", "skip", "clear", "shuffle", "loop"],
};
exports.rows = rows;
async function buildRow(id, guild) {
    const data = new discord_js_1.MessageActionRow();
    const row = rows[id];
    for (let i = 0; i < row.length; i++) {
        const comp = row[i];
        for (let j = 0; j < btns.length; j++) {
            const btn = btns[j];
            if (btn.id == comp) {
                data.addComponents(await btn.build(guild));
                break;
            }
        }
    }
    return data;
}
exports.buildRow = buildRow;
