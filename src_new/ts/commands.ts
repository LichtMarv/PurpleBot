import { ApplicationCommand, Collection, CommandInteraction, DiscordAPIError, Guild, GuildResolvable, InteractionReplyOptions, Message, MessageActionRow, MessageButton, MessageEmbed, MessagePayload, TextBasedChannel, TextChannel } from "discord.js";
import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "@discordjs/builders";
import * as common from "./common";
import { buildRow } from "./buttons";
const AsciiTable = require("ascii-table");

type command = {
    name: string,
    description: string,
    options?: { name: string, type: string, description: string, required: boolean }[],
    run: (interaction: CommandInteraction, command: ApplicationCommand | ApplicationCommand<{ guild: GuildResolvable; }>) => Promise<string | MessagePayload | InteractionReplyOptions | null>,
    builder?: () => Promise<SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder>,
}

const cmds: command[] = [
    {
        name: "help",
        description: "lists the commands i guess",
        run: async function (interaction, command) {
            var table = new AsciiTable("Command Help");
            //table.setHeading('Name', 'Aliases', 'Description');
            const embed = new MessageEmbed()
                .setTitle("HELP")
                .setColor(0xf5cd07);
            for (let i = 0; i < cmds.length; i++) {
                var c = cmds[i];
                embed.addField(c.name, c.description);
            }
            embed.setFooter({ text: "have fun xD" });
            return { embeds: [embed] };
        }
    },
    {
        name: "ping",
        description: "shows you your ping (may be influenced heavily by my internet xD)",
        run: async function (interaction, command) {
            return `Pong! ${Date.now() - interaction.createdTimestamp}ms. API: ${Math.round(common.client.ws.ping)}ms`;
        }
    },
    {
        name: "test",
        description: "testing options be like",
        options: [{ name: "var1", type: "string", description: "just a test param", required: true }],
        run: async function (interaction, command) {
            let s = interaction.options.getString("var1");
            let row = await buildRow("musicRow");
            return { content: "lol " + s, ephemeral: true, components: [row] };
        }
    },
    {
        name: "say",
        description: "post Message in Channel",
        options: [
            { name: "message", type: "string", description: "the Message to post", required: true },
            { name: "channel", type: "channel", description: "the Channel to post the Message in", required: false }
        ],
        run: async function (interaction, command) {
            const msg = interaction.options.getString("message", true);
            let channel = interaction.options.getChannel("channel", false)?.id;
            if (channel == null && interaction.inGuild())
                channel = await interaction.channelId;
            if (channel == undefined || interaction.guildId == null)
                return null;

            let ch = await (await common.client.guilds.fetch(interaction.guildId)).channels.fetch(channel);
            if (ch instanceof TextChannel) {
                ch.send(msg);
                return { content: "send msg!", ephemeral: true };
            }

            return null
        }
    },
    {
        name: "meme",
        description: "Marks a message as a meme for the bot",
        options: [{ name: "link", type: "string", description: "link to the meme", required: true }],
        builder: async function () {
            let data = new SlashCommandBuilder()
                .setName(this.name)
                .setDescription(this.description)
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('link')
                        .setDescription('use link of meme')
                        .addStringOption(option => option.setName("link").setDescription('link to the meme').setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('attachment')
                        .setDescription('use file for meme')
                        .addAttachmentOption(option => option.setName("file").setDescription('Image or something').setRequired(true)));


            return data;
        },
        run: async function (interaction, command) {
            console.log("New message marked on " + interaction.guild?.name);
            /* //await memesdb.insert({server:msg.guild.id, msg : msg.id, channel: msg.channel.id, author: msg.author.id,score: 0, upvote : 1, downvote : 1, time: Date.now()});
            //var user = await userdb.findOne({server:msg.guild.id, user:msg.author.id});
            if(user == null) {
                await userdb.insert({user:msg.author.id,server:msg.guild.id, score:0});
            } */
            if (interaction.options.getSubcommand() == "link") {
                const link = interaction.options.getString("link", true);
                await interaction.reply(link);
            } else {
                const att = interaction.options.getAttachment("file", true);
                await interaction.reply({ files: [att] });
            }

            let res = await interaction.fetchReply();
            if (res instanceof Message) {
                await res.react("⬆");
                await res.react("⬇");
            } else {
                interaction.editReply("ERROR: couldn't add reactions to Message!");
            }

            return null;
        }
    },
]

async function buildCommands() {
    let datas: (SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder)[] = [];
    for (let i = 0; i < cmds.length; i++) {
        const cmd = cmds[i];
        if (cmd.builder) {
            let data = await cmd.builder();
            datas.push(data);
            continue;
        }
        let data = new SlashCommandBuilder()
            .setName(cmd.name)
            .setDescription(cmd.description);

        cmd.options?.forEach(option => {
            switch (option.type) {
                case "string":
                    data.addStringOption(op => op.setName(option.name).setDescription(option.description).setRequired(option.required));
                    break;

                case "channel":
                    data.addChannelOption(op => op.setName(option.name).setDescription(option.description).setRequired(option.required));
                    break;

                default:
                    break;
            }
        });
        console.log("registering /" + cmd.name);
        datas.push(data);
    }
    return datas;
}

async function deleteCommands() {
    common.client.guilds.cache.forEach((val, key) => {
        console.log("deleting commands for " + val.name);
        val.commands.cache.forEach((cmd, key) => {
            cmd.delete();
        })
    });
}

async function registerCommands(guilds: Collection<string, Guild>) {
    await deleteCommands();
    const datas = await buildCommands();
    for (const guildCol of guilds) {
        const guild = guildCol[1];
        let failed: boolean = false;
        for (let data of datas) {
            await guild.commands.create(data.toJSON()).catch(e => {
                if (e instanceof DiscordAPIError && e.code == 50001) {
                    failed = true;
                } else {
                    console.error(e);
                }
            });
        }
        if (failed)
            console.log("no permission for guild: " + guild);
    }
}

export {
    cmds,
    registerCommands
};