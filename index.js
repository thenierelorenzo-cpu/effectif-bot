require('dotenv').config();
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

const BCSO_GREEN = 0x0B5E3C;

// ⚠️ Emojis personnalisés EXACTEMENT comme dans ton serveur
const structure = {
    "Office of the Sheriff": {
        "Sheriff": "Sheriff",
        "UnderSheriff": "UnderSheriff"
    },
    "Executive Staff": {
        "Assistant Sheriff": "AssistantSheriff",
        "Division Chief": "divisionchief",
        "Area Commander": "Area_Commander",
        "Captain": "Captain"
    },
    "Supervisor": {
        "Lieutenant": "Lieutenant",
        "Sergeant Major": "Sergeant_Major",
        "Sergeant II": "Sergent_II",
        "Sergeant I": "Sergeant_I"
    },
    "Application Unit": {
        "Senior Deputy Sheriff": "Senior_Deputy_Sheriff",
        "Deputy Sheriff III": "Deputy_III",
        "Deputy Sheriff II": "Deputy",
        "Deputy Sheriff I": "Deputy",
        "Deputy Sheriff Trainee": "Deputy"
    }
};

let messageId = null;

client.once('ready', async () => {
    console.log(`Connecté en tant que ${client.user.tag}`);

    const guild = client.guilds.cache.first();
    const channel = guild.channels.cache.find(c => c.name === "effectifs");

    if (!channel) return console.log("❌ Crée un salon nommé 'effectifs'");

    const embed = await generateEmbed(guild);

    const button = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("refresh_effectifs")
            .setLabel("🔄 Actualiser")
            .setStyle(ButtonStyle.Success)
    );

    const msg = await channel.send({
        embeds: [embed],
        components: [button]
    });

    messageId = msg.id;

    // 🔄 Auto refresh toutes les 5 minutes
    setInterval(async () => {
        const newEmbed = await generateEmbed(guild);
        const message = await channel.messages.fetch(messageId);
        message.edit({ embeds: [newEmbed] });
    }, 300000);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "refresh_effectifs") {
        const embed = await generateEmbed(interaction.guild);
        await interaction.update({ embeds: [embed] });
    }
});

async function generateEmbed(guild) {
    await guild.members.fetch();

    let total = 0;

    const embed = new EmbedBuilder()
        .setTitle("Broward County Sheriff's Office")
        .setDescription("📋 **Liste des effectifs officiels**\nMise à jour automatique par unité")
        .setColor(BCSO_GREEN)
        .setThumbnail("https://i.imgur.com/TON_LOGO.png") // 🔥 Remplace par ton lien logo
        .setTimestamp();

    for (const section in structure) {
        let text = "";

        for (const roleName in structure[section]) {
            const emojiName = structure[section][roleName];
            const emoji = guild.emojis.cache.find(e => e.name === emojiName);
            const emojiDisplay = emoji ? `<:${emoji.name}:${emoji.id}>` : "";

            const role = guild.roles.cache.find(r => r.name === roleName);

            text += `\n${emojiDisplay} **${roleName}**\n`;

            if (!role || role.members.size === 0) {
                text += "Aucun membre\n";
            } else {
                role.members.forEach(member => {
                    if (!member.user.bot) {
                        text += `<@${member.id}>\n`;
                        total++;
                    }
                });
            }
        }

        embed.addFields({
            name: `━━━━━━━━━━━━━━━━━━\n${section}`,
            value: text || "Aucun membre",
            inline: false
        });
    }

    embed.setFooter({
        text: `👥 Total d'effectifs actifs : ${total}`
    });

    return embed;
}

client.login(process.env.TOKEN);
