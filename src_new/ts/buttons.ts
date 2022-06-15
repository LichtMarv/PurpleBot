import { ButtonInteraction, GuildMember, InteractionReplyOptions, MessageActionRow, MessageButton, MessagePayload, VoiceChannel } from "discord.js"
import { getPause, shiftQueue, stopMusic, toggleLoop, togglePause } from "./music";

type button = {
    name: string,
    id: string,
    build: (guild: string | undefined) => Promise<MessageButton>,
    run: (interaction: ButtonInteraction) => Promise<string | MessagePayload | InteractionReplyOptions | null>,
}

const btns: button[] = [
    {
        name: "Pause",
        id: "pause",
        build: async function (guild) {
            let p = await getPause(guild as string);
            return new MessageButton()
                .setLabel(p ? "Resume" : "Pause")
                .setCustomId(this.id)
                .setEmoji(p ? "▶️" : "⏸️")
                .setStyle("PRIMARY");
        },
        run: async function (interaction) {
            let suc = await togglePause(interaction.guildId as string, (interaction.member as GuildMember)?.voice?.channel as VoiceChannel);
            let c = await buildRow("musicRow", interaction.guildId as string);
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
            return new MessageButton()
                .setLabel(this.name)
                .setCustomId(this.id)
                .setEmoji("⏭️")
                .setStyle("PRIMARY");
        },
        run: async function (interaction) {
            shiftQueue(interaction.guildId as string);
            interaction.deferUpdate();
            return null;
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
            stopMusic(interaction.guildId as string);
            interaction.deferUpdate();
            return null;
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
            await toggleLoop(interaction.guildId as string);
            interaction.deferUpdate();
            return null;
        }
    },
];

const rows: { [id: string]: string[] } = {
    musicRow: ["pause", "skip", "clear", "shuffle", "loop"],
}

async function buildRow(id: string, guild: string) {
    const data = new MessageActionRow();
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

export {
    btns,
    rows,
    buildRow
}