import { ButtonInteraction, InteractionReplyOptions, MessageActionRow, MessageButton, MessagePayload } from "discord.js"

type button = {
    name: string,
    id: string,
    build: () => Promise<MessageButton>,
    run: (interaction: ButtonInteraction) => Promise<string | MessagePayload | InteractionReplyOptions | null>,
}

const btns: button[] = [
    {
        name: "Pause",
        id: "pause",
        build: async function () {
            return new MessageButton()
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
            return new MessageButton()
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
            return new MessageButton()
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
            return new MessageButton()
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
            return new MessageButton()
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

const rows: { [id: string]: string[] } = {
    musicRow: ["pause", "skip", "clear", "shuffle", "loop"],
}

async function buildRow(id: string) {
    const data = new MessageActionRow();
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

export {
    btns,
    rows,
    buildRow
}