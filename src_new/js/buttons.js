"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRow = exports.rows = exports.btns = void 0;
const discord_js_1 = require("discord.js");
const btns = [
    {
        name: "Pause",
        id: "pause",
        build: async function () {
            return new discord_js_1.MessageButton()
                .setLabel(this.name)
                .setCustomId(this.id)
                .setEmoji("⏸️")
                .setStyle("PRIMARY");
        },
        run: async function (interaction) {
            return "Pause Song";
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
            return "Skip Song";
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
            return "Clear list";
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
            return "Shuffle list";
        }
    },
    {
        name: "Loop",
        id: "loop",
        build: async function () {
            return new discord_js_1.MessageButton()
                .setLabel(this.name)
                .setCustomId(this.id)
                .setEmoji("🔁")
                .setStyle("PRIMARY");
        },
        run: async function (interaction) {
            return "Loop list";
        }
    },
];
exports.btns = btns;
const rows = {
    musicRow: ["pause", "skip", "clear", "shuffle", "loop"],
};
exports.rows = rows;
async function buildRow(id) {
    const data = new discord_js_1.MessageActionRow();
    const row = rows[id];
    for (let i = 0; i < row.length; i++) {
        const comp = row[i];
        for (let j = 0; j < btns.length; j++) {
            const btn = btns[j];
            if (btn.id == comp) {
                data.addComponents(await btn.build());
                break;
            }
        }
    }
    return data;
}
exports.buildRow = buildRow;
