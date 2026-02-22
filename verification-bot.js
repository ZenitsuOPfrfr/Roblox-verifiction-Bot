// ============================================================================
// MEGA BOT - VERIFICATION + STOCK SYSTEM
// Roblox verification, Ghost ping, Brainrot marketplace
// ============================================================================

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

console.log('🔐 Verification + Stock Bot - Starting...');

// ============================================================================
// CLIENT SETUP  
// ============================================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ============================================================================
// CONFIGURATION - UPDATE THESE!
// ============================================================================

const CONFIG = {
    VERIFIED_ROLE_ID: '1429290360030499019',
    VERIFY_CHANNEL_ID: 'YOUR_VERIFY_CHANNEL_ID',
    GHOST_PING_CHANNEL_ID: '1473088159440179392',
    
    COLORS: {
        PRIMARY: 0x00D9FF,
        SUCCESS: 0x00FF88,
        ERROR: 0xFF4757,
        WARNING: 0xFFA502,
        GOLD: 0xFFD700
    },
    
    VERIFY_COOLDOWN: 10
};

// ============================================================================
// DATA STORAGE
// ============================================================================

const STOCK_FILE = path.join(__dirname, 'stock.json');

const verifiedUsers = new Map();
const cooldowns = new Map();
const verificationCodes = new Map();

function loadStock() {
    try {
        if (fs.existsSync(STOCK_FILE)) {
            return JSON.parse(fs.readFileSync(STOCK_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading stock:', error);
    }
    return [];
}

function saveStock(stock) {
    try {
        fs.writeFileSync(STOCK_FILE, JSON.stringify(stock, null, 2));
    } catch (error) {
        console.error('Error saving stock:', error);
    }
}

let stock = loadStock();

// ============================================================================
// VERIFICATION CODE GENERATOR
// ============================================================================

function generateVerificationCode() {
    const sentences = [
        "I love trading on Roblox",
        "Discord verification rocks",
        "Trading safely everyday",
        "Verified member here",
        "Best trading community",
        "Roblox trading is fun",
        "Safe trades only",
        "Honest trader always",
        "Trust and verify",
        "Community first always",
        "Trading with friends",
        "Respect all traders",
        "Fair trades matter",
        "Building trust daily",
        "Happy trading everyone",
        "Positive vibes only",
        "Making good deals",
        "Trading responsibly today",
        "Verified and proud",
        "Safe server vibes",
        "Friendly trader here",
        "Making connections daily",
        "Quality trades always",
        "Verified trader ready",
        "Building reputation now"
    ];
    
    const sentence = sentences[Math.floor(Math.random() * sentences.length)];
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `${sentence} ${number}`;
}

// ============================================================================
// STOCK SYSTEM FUNCTIONS
// ============================================================================

function convertUSDtoRobux(usd) {
    // Roblox DevEx rate: ~$0.0035 per Robux
    // To account for 30% tax, we calculate how much buyer needs to pay
    const robuxValue = Math.ceil(usd / 0.0035);
    const withTax = Math.ceil(robuxValue / 0.7); // Add 30% tax so you get full amount
    return {
        robuxNeeded: withTax,
        youReceive: robuxValue
    };
}

function formatStockEmbed(stockItems) {
    if (stockItems.length === 0) {
        return {
            title: '📦 STOCK - CURRENTLY EMPTY',
            description: '```\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                '         NO ITEMS AVAILABLE\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                '```\n\n' +
                '**No brainrots for sale right now!**\n\n' +
                '> Check back later for new listings!\n' +
                '> Follow announcements for restocks!',
            color: 0xFF4757,
            footer: 'Stock is empty • Check back soon!'
        };
    }

    let description = '```\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '         AVAILABLE BRAINROTS\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '```\n\n';

    stockItems.forEach((item, index) => {
        const robuxInfo = convertUSDtoRobux(item.price);
        
        description += `## **${index + 1}. ${item.brainrot}**\n`;
        description += `> **🧬 Mutations:** ${item.mutations}\n\n`;
        description += `> **💵 USD Price:** $${item.price.toFixed(2)}\n`;
        description += `> **💎 Robux Price:** ${robuxInfo.robuxNeeded.toLocaleString()} R$\n`;
        description += `> *└ You pay ${robuxInfo.robuxNeeded.toLocaleString()} R$, I get ${robuxInfo.youReceive.toLocaleString()} R$ after tax*\n\n`;
        description += `> **📅 Listed:** <t:${Math.floor(item.listedAt / 1000)}:R>\n`;
        description += `> **🆔 Item ID:** \`${item.id}\`\n`;
        description += '```\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n```\n\n';
    });

    description += '```fix\n' +
        '💬 DM ME TO PURCHASE!\n' +
        '```\n\n' +
        '**📋 How to Buy:**\n' +
        '> 1. DM me with item number or ID\n' +
        '> 2. Choose: PayPal (USD) or Robux\n' +
        '> 3. Send payment\n' +
        '> 4. Get your brainrot!\n\n' +
        '**💳 Payment Methods:**\n' +
        '> • **PayPal** (USD)\n' +
        '> • **CashApp** (USD)\n' +
        '> • **Robux** (via gamepass/group payout)\n\n' +
        '**⚠️ Important:**\n' +
        '> Robux prices include 30% tax\n' +
        '> All sales final - no refunds\n' +
        '> DM for bulk discounts!';

    return {
        title: '🛒 BRAINROT MARKETPLACE',
        description: description,
        color: 0x00D9FF,
        footer: `${stockItems.length} item${stockItems.length === 1 ? '' : 's'} in stock • Last updated: ${new Date().toLocaleString()}`
    };
}

// ============================================================================
// ROBLOX API FUNCTIONS
// ============================================================================

async function getRobloxUserByUsername(username) {
    try {
        const response = await axios.post('https://users.roblox.com/v1/usernames/users', {
            usernames: [username],
            excludeBannedUsers: false
        });
        
        if (!response.data.data || response.data.data.length === 0) {
            return null;
        }
        
        return response.data.data[0];
    } catch (error) {
        console.error('[ROBLOX API ERROR]:', error.message);
        return null;
    }
}

async function getRobloxUserById(userId) {
    try {
        const response = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error('[ROBLOX API ERROR]:', error.message);
        return null;
    }
}

async function getRobloxThumbnail(userId) {
    try {
        const response = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`);
        if (response.data.data && response.data.data[0]) {
            return response.data.data[0].imageUrl;
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function checkRobloxDescription(userId, verificationCode) {
    try {
        const user = await getRobloxUserById(userId);
        if (!user || !user.description) {
            return false;
        }
        return user.description.includes(verificationCode);
    } catch (error) {
        return false;
    }
}

// ============================================================================
// BOT READY
// ============================================================================

client.once('ready', () => {
    console.log(`✅ Verification + Stock Bot Ready: ${client.user.tag}`);
    console.log(`🔐 Verified users: ${verifiedUsers.size}`);
    console.log(`📦 Items in stock: ${stock.length}`);
    console.log(`📋 Commands: -verify, -stock, -updatestock`);
});

// ============================================================================
// GHOST PING
// ============================================================================

client.on('guildMemberAdd', async (member) => {
    try {
        console.log(`[NEW MEMBER] ${member.user.tag} joined`);
        
        const ghostPingChannel = member.guild.channels.cache.get(CONFIG.GHOST_PING_CHANNEL_ID);
        
        if (!ghostPingChannel) return;

        const pingMessage = await ghostPingChannel.send(`${member}`);
        
        console.log(`[GHOST PING] Pinged ${member.user.tag}`);
        
        setTimeout(async () => {
            try {
                await pingMessage.delete();
            } catch (error) {}
        }, 1000);
        
    } catch (error) {
        console.error('[GHOST PING ERROR]:', error);
    }
});

// ============================================================================
// VERIFICATION PANEL
// ============================================================================

async function createVerificationPanel(channel) {
    const embed = new EmbedBuilder()
        .setColor(CONFIG.COLORS.PRIMARY)
        .setAuthor({ 
            name: '🔐 ROBLOX VERIFICATION SYSTEM',
            iconURL: channel.guild.iconURL()
        })
        .setTitle('Link Your Roblox Account')
        .setDescription(
            '```\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            '    VERIFY TO ACCESS THE SERVER\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            '```\n' +
            '**Why verify?**\n' +
            '> • Access all channels\n' +
            '> • Participate in events\n' +
            '> • Join giveaways\n' +
            '> • Trade safely\n\n' +
            '**Click the button below to start!**\n' +
            '> ✨ Takes less than 30 seconds\n' +
            '> ✨ Mobile-friendly with easy copying\n' +
            '> ✨ Reroll button if code gets tagged\n\n' +
            '```fix\n' +
            '⚡ INSTANT VERIFICATION • 100% SECURE\n' +
            '```'
        )
        .addFields(
            { 
                name: '📋 How It Works', 
                value: '> 1️⃣ Click **Start Verification**\n> 2️⃣ Enter Roblox username\n> 3️⃣ Copy short code to Roblox About\n> 4️⃣ Click Verify - Done!', 
                inline: false 
            }
        )
        .setFooter({ text: '👇 Click to get started!' })
        .setTimestamp()
        .setThumbnail(channel.guild.iconURL());

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('start_verification')
                .setLabel('🔐 Start Verification')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✨'),
            new ButtonBuilder()
                .setCustomId('verify_help')
                .setLabel('❓ Need Help?')
                .setStyle(ButtonStyle.Secondary)
        );

    return channel.send({ embeds: [embed], components: [row] });
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

client.on('messageCreate', async (message) => {
    try {
        if (message.author.bot) return;

        const content = message.content.trim();

        // VERIFICATION COMMANDS
        if (content === '-verify') {
            if (!message.member.permissions.has('Administrator')) {
                return message.reply('❌ Admin only!');
            }

            await createVerificationPanel(message.channel);
            
            try {
                await message.delete();
            } catch (e) {}
            
            return;
        }

        if (content.startsWith('-unverify')) {
            if (!message.member.permissions.has('Administrator')) {
                return message.reply('❌ Admin only!');
            }

            const mentioned = message.mentions.users.first();
            if (!mentioned) {
                return message.reply('❌ Usage: `-unverify @user`');
            }

            const member = await message.guild.members.fetch(mentioned.id);
            const verifiedRole = message.guild.roles.cache.get(CONFIG.VERIFIED_ROLE_ID);
            
            if (verifiedRole && member.roles.cache.has(CONFIG.VERIFIED_ROLE_ID)) {
                await member.roles.remove(verifiedRole);
                verifiedUsers.delete(mentioned.id);
                
                return message.reply(`✅ Unverified ${mentioned}`);
            } else {
                return message.reply(`❌ ${mentioned} not verified!`);
            }
        }

        if (content.startsWith('-whois')) {
            const args = content.split(' ').slice(1);
            if (args.length === 0) {
                return message.reply('❌ Usage: `-whois @user` or `-whois RobloxUsername`');
            }

            const mentioned = message.mentions.users.first();
            
            if (mentioned) {
                const data = verifiedUsers.get(mentioned.id);
                
                if (!data) {
                    return message.reply(`❌ ${mentioned} not verified!`);
                }

                const thumbnail = await getRobloxThumbnail(data.robloxId);

                const embed = new EmbedBuilder()
                    .setColor(CONFIG.COLORS.PRIMARY)
                    .setTitle('🔍 User Information')
                    .setDescription(`**Discord:** ${mentioned}\n**Roblox:** ${data.robloxUsername}`)
                    .addFields(
                        { name: '🎮 Roblox ID', value: `${data.robloxId}`, inline: true },
                        { name: '📅 Verified', value: `<t:${Math.floor(data.verifiedAt / 1000)}:R>`, inline: true }
                    )
                    .setThumbnail(thumbnail)
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            } else {
                const robloxUser = await getRobloxUserByUsername(args.join(' '));
                
                if (!robloxUser) {
                    return message.reply('❌ Roblox user not found!');
                }

                let discordUser = null;
                for (const [discordId, data] of verifiedUsers.entries()) {
                    if (data.robloxId === robloxUser.id) {
                        try {
                            discordUser = await client.users.fetch(discordId);
                            break;
                        } catch (e) {}
                    }
                }

                const thumbnail = await getRobloxThumbnail(robloxUser.id);

                const embed = new EmbedBuilder()
                    .setColor(CONFIG.COLORS.PRIMARY)
                    .setTitle('🔍 Roblox User')
                    .setDescription(`**Roblox:** ${robloxUser.name}\n**ID:** ${robloxUser.id}`)
                    .addFields(
                        { name: '📊 Display Name', value: robloxUser.displayName, inline: true },
                        { name: '🔗 Discord', value: discordUser ? `${discordUser}` : 'Not verified', inline: true }
                    )
                    .setThumbnail(thumbnail)
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }
        }

        // STOCK COMMANDS
        if (content === '-stock') {
            const stockData = formatStockEmbed(stock);
            
            const embed = new EmbedBuilder()
                .setColor(stockData.color)
                .setAuthor({ 
                    name: '🛒 BRAINROT MARKETPLACE',
                    iconURL: message.guild.iconURL()
                })
                .setTitle(stockData.title)
                .setDescription(stockData.description)
                .setFooter({ text: stockData.footer })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        if (content === '-updatestock') {
            if (!message.member.permissions.has('Administrator')) {
                return message.reply('❌ Admin only!');
            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('stock_add')
                        .setLabel('➕ Add Item')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🔥'),
                    new ButtonBuilder()
                        .setCustomId('stock_remove')
                        .setLabel('🗑️ Remove Item')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('stock_view')
                        .setLabel('👁️ View Stock')
                        .setStyle(ButtonStyle.Primary)
                );

            const embed = new EmbedBuilder()
                .setColor(CONFIG.COLORS.GOLD)
                .setTitle('📦 Stock Management Panel')
                .setDescription(
                    '```\n' +
                    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                    '       MANAGE YOUR BRAINROT STOCK\n' +
                    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                    '```\n\n' +
                    '**What would you like to do?**\n\n' +
                    '**🔥 Add Item** → List new brainrot for sale\n' +
                    '> Enter name, mutations, and price\n' +
                    '> Auto-calculates Robux conversion\n\n' +
                    '**🗑️ Remove Item** → Delete sold items\n' +
                    '> Shows all items with IDs\n' +
                    '> Use `-removestock [ID]` to remove\n\n' +
                    '**👁️ View Stock** → See current inventory\n' +
                    '> Preview what users see\n' +
                    '> Check all listings\n\n' +
                    '```fix\n' +
                    `Current Stock: ${stock.length} item${stock.length === 1 ? '' : 's'}\n` +
                    '```'
                )
                .setFooter({ text: 'Click a button below to continue' })
                .setTimestamp();

            return message.reply({ embeds: [embed], components: [row] });
        }

        if (content.startsWith('-removestock')) {
            if (!message.member.permissions.has('Administrator')) {
                return message.reply('❌ Admin only!');
            }

            const itemId = content.split(' ')[1];
            if (!itemId) {
                return message.reply('❌ Usage: `-removestock [item ID]`\n\nUse `-updatestock` then "Remove Item" to see IDs.');
            }

            const index = stock.findIndex(item => item.id === itemId);
            if (index === -1) {
                return message.reply('❌ Item not found! Check the ID with `-updatestock` → "Remove Item"');
            }

            const removed = stock.splice(index, 1)[0];
            saveStock(stock);

            const embed = new EmbedBuilder()
                .setColor(CONFIG.COLORS.SUCCESS)
                .setTitle('✅ Item Removed from Stock')
                .setDescription(
                    `**Removed:**\n` +
                    `> **Brainrot:** ${removed.brainrot}\n` +
                    `> **Mutations:** ${removed.mutations}\n` +
                    `> **Price:** $${removed.price.toFixed(2)}\n\n` +
                    `Item no longer visible in \`-stock\``
                )
                .setFooter({ text: `Removed by ${message.author.username}` })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

    } catch (error) {
        console.error('[MESSAGE ERROR]:', error);
    }
});

// ============================================================================
// INTERACTION HANDLER
// ============================================================================

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isButton()) {
            // VERIFICATION BUTTONS
            if (interaction.customId === 'start_verification') {
                const cooldown = cooldowns.get(interaction.user.id);
                if (cooldown && Date.now() - cooldown < CONFIG.VERIFY_COOLDOWN * 1000) {
                    const timeLeft = Math.ceil((CONFIG.VERIFY_COOLDOWN * 1000 - (Date.now() - cooldown)) / 1000);
                    return interaction.reply({
                        content: `⏰ Wait ${timeLeft}s before verifying again!`,
                        ephemeral: true
                    });
                }

                if (verifiedUsers.has(interaction.user.id)) {
                    const data = verifiedUsers.get(interaction.user.id);
                    return interaction.reply({
                        content: `✅ Already verified as **${data.robloxUsername}**!`,
                        ephemeral: true
                    });
                }

                const modal = new ModalBuilder()
                    .setCustomId('verification_modal')
                    .setTitle('🔐 Roblox Verification');

                const usernameInput = new TextInputBuilder()
                    .setCustomId('roblox_username')
                    .setLabel('Enter your Roblox Username')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Example: Builderman')
                    .setRequired(true)
                    .setMaxLength(20)
                    .setMinLength(3);

                modal.addComponents(new ActionRowBuilder().addComponents(usernameInput));

                await interaction.showModal(modal);
                cooldowns.set(interaction.user.id, Date.now());
            }

            if (interaction.customId === 'verify_help') {
                const embed = new EmbedBuilder()
                    .setColor(CONFIG.COLORS.PRIMARY)
                    .setTitle('❓ Verification Help')
                    .setDescription(
                        '**Step-by-Step:**\n\n' +
                        '**1️⃣ Click "Start Verification"**\n' +
                        '> Enter your Roblox username\n\n' +
                        '**2️⃣ Copy Your Code**\n' +
                        '> You\'ll get a short sentence like:\n' +
                        '> "I love trading on Roblox 4729"\n' +
                        '> **Mobile: Long press to copy!** 📱\n\n' +
                        '**3️⃣ Add to Roblox Profile**\n' +
                        '> Roblox.com → Settings → Profile → About\n' +
                        '> Paste the code anywhere\n\n' +
                        '**4️⃣ Click Verify**\n' +
                        '> Done in 30 seconds!\n\n' +
                        '**Code tagged by Roblox?**\n' +
                        '> Just click "Reroll Code" for a new one!\n\n' +
                        '**Still stuck?** Ask staff for help!'
                    )
                    .setFooter({ text: 'Average time: 30 seconds' })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (interaction.customId.startsWith('verify_reroll_')) {
                const robloxUsername = interaction.customId.split('_')[2];
                
                const newCode = generateVerificationCode();
                verificationCodes.set(interaction.user.id, newCode);
                
                const robloxUser = await getRobloxUserByUsername(robloxUsername);
                if (!robloxUser) {
                    return interaction.reply({
                        content: '❌ Error. Please start over.',
                        ephemeral: true
                    });
                }
                
                const thumbnail = await getRobloxThumbnail(robloxUser.id);
                
                const embed = new EmbedBuilder()
                    .setColor(CONFIG.COLORS.WARNING)
                    .setAuthor({ 
                        name: '🔄 NEW CODE GENERATED',
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTitle('Try This Code Instead!')
                    .setDescription(
                        '**New verification code:**\n\n' +
                        '```\n' + newCode + '\n```\n\n' +
                        '**What to do:**\n' +
                        '> 1. **Long press code above to copy** 📱\n' +
                        '> 2. Open [Roblox Settings](https://www.roblox.com/my/account#!/info)\n' +
                        '> 3. Paste in About section\n' +
                        '> 4. Save\n' +
                        '> 5. Click **Verify Me!**\n\n' +
                        '```fix\n' +
                        '💡 This code is less likely to be tagged!\n' +
                        '```'
                    )
                    .setThumbnail(thumbnail)
                    .setFooter({ text: 'Code: ' + newCode })
                    .setTimestamp();

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('📝 Open Roblox Settings')
                            .setStyle(ButtonStyle.Link)
                            .setURL('https://www.roblox.com/my/account#!/info'),
                        new ButtonBuilder()
                            .setCustomId(`verify_check_${robloxUsername}`)
                            .setLabel('✅ Verify Me!')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('🔐'),
                        new ButtonBuilder()
                            .setCustomId(`verify_reroll_${robloxUsername}`)
                            .setLabel('🔄 Reroll Again')
                            .setStyle(ButtonStyle.Secondary)
                    );

                return interaction.update({ embeds: [embed], components: [row] });
            }

            if (interaction.customId.startsWith('verify_check_')) {
                const robloxUsername = interaction.customId.split('_')[2];
                
                const robloxUser = await getRobloxUserByUsername(robloxUsername);
                
                if (!robloxUser) {
                    return interaction.reply({
                        content: '❌ Could not find Roblox account.',
                        ephemeral: true
                    });
                }

                const verificationCode = verificationCodes.get(interaction.user.id);
                
                if (!verificationCode) {
                    return interaction.reply({
                        content: '❌ Code expired. Start over.',
                        ephemeral: true
                    });
                }

                const isValid = await checkRobloxDescription(robloxUser.id, verificationCode);
                
                if (!isValid) {
                    const embed = new EmbedBuilder()
                        .setColor(CONFIG.COLORS.ERROR)
                        .setTitle('❌ Verification Failed')
                        .setDescription(
                            '**Code not found in your Roblox About!**\n\n' +
                            '**Your code:**\n' +
                            '```\n' + verificationCode + '\n```\n\n' +
                            '**To fix:**\n' +
                            '> 1. **Long press code to copy** 📱\n' +
                            '> 2. [Open Roblox Settings](https://www.roblox.com)\n' +
                            '> 3. Go to Profile → About\n' +
                            '> 4. Paste code\n' +
                            '> 5. Save\n' +
                            '> 6. Click **Try Again**\n\n' +
                            '**Code tagged? Click "Reroll Code"!**'
                        )
                        .setFooter({ text: 'Takes 30 seconds!' })
                        .setTimestamp();

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('📝 Open Settings')
                                .setStyle(ButtonStyle.Link)
                                .setURL('https://www.roblox.com/my/account#!/info'),
                            new ButtonBuilder()
                                .setCustomId(`verify_check_${robloxUsername}`)
                                .setLabel('🔄 Try Again')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`verify_reroll_${robloxUsername}`)
                                .setLabel('🔄 Reroll Code')
                                .setStyle(ButtonStyle.Secondary)
                        );

                    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
                }

                // SUCCESS!
                const member = await interaction.guild.members.fetch(interaction.user.id);
                const verifiedRole = interaction.guild.roles.cache.get(CONFIG.VERIFIED_ROLE_ID);
                
                if (verifiedRole) {
                    await member.roles.add(verifiedRole);
                }

                verifiedUsers.set(interaction.user.id, {
                    robloxId: robloxUser.id,
                    robloxUsername: robloxUser.name,
                    verifiedAt: Date.now()
                });

                // Update nickname
                try {
                    const currentNick = member.nickname || member.user.username;
                    const cleanNick = currentNick.replace(/\s*\([^)]*\)\s*$/, '').trim();
                    const newNick = `${cleanNick} (${robloxUser.name})`;
                    
                    if (newNick.length <= 32) {
                        await member.setNickname(newNick);
                    } else {
                        await member.setNickname(`(${robloxUser.name})`);
                    }
                } catch (nickError) {}

                const thumbnail = await getRobloxThumbnail(robloxUser.id);

                const successEmbed = new EmbedBuilder()
                    .setColor(CONFIG.COLORS.SUCCESS)
                    .setAuthor({ 
                        name: '✅ VERIFICATION SUCCESSFUL',
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTitle('Welcome to the Server!')
                    .setDescription(
                        '```\n' +
                        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                        '         YOU\'RE NOW VERIFIED!\n' +
                        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                        '```\n' +
                        '**Account linked!**\n\n' +
                        '> **Discord:** ' + interaction.user + '\n' +
                        '> **Roblox:** ' + robloxUser.name + '\n' +
                        '> **Roblox ID:** ' + robloxUser.id + '\n' +
                        '> **Nickname:** Updated!\n\n' +
                        '**You now have access to:**\n' +
                        '> ✅ All channels\n' +
                        '> ✅ Trading & giveaways\n' +
                        '> ✅ Check `-stock` for brainrots!\n\n' +
                        '```fix\n' +
                        '🎉 Enjoy your stay!\n' +
                        '```'
                    )
                    .setThumbnail(thumbnail)
                    .setFooter({ text: `Verified: ${interaction.user.username}` })
                    .setTimestamp();

                verificationCodes.delete(interaction.user.id);

                return interaction.reply({ embeds: [successEmbed], ephemeral: true });
            }

            // STOCK BUTTONS
            if (interaction.customId === 'stock_add') {
                const modal = new ModalBuilder()
                    .setCustomId('stock_add_modal')
                    .setTitle('➕ Add New Stock Item');

                const brainrotInput = new TextInputBuilder()
                    .setCustomId('brainrot_name')
                    .setLabel('What brainrot are you selling?')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Example: Sigma Male, Ohio Rizz, Skibidi Gyatt')
                    .setRequired(true)
                    .setMaxLength(100);

                const mutationsInput = new TextInputBuilder()
                    .setCustomId('mutations')
                    .setLabel('Mutations/Stats/Details')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Example: Legendary, Shiny, 100% Aura, Max Level')
                    .setRequired(true)
                    .setMaxLength(500);

                const priceInput = new TextInputBuilder()
                    .setCustomId('price_usd')
                    .setLabel('Price in USD ($)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Example: 5.99 or 10.00')
                    .setRequired(true)
                    .setMaxLength(10);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(brainrotInput),
                    new ActionRowBuilder().addComponents(mutationsInput),
                    new ActionRowBuilder().addComponents(priceInput)
                );

                await interaction.showModal(modal);
            }

            if (interaction.customId === 'stock_remove') {
                if (stock.length === 0) {
                    return interaction.reply({
                        content: '❌ No items in stock to remove!',
                        ephemeral: true
                    });
                }

                let description = '**Current Stock Items:**\n\n';
                stock.forEach((item, index) => {
                    description += `\`${item.id}\` → **${item.brainrot}** ($${item.price.toFixed(2)})\n`;
                    description += `   └ *${item.mutations}*\n\n`;
                });
                description += '**To remove:** Type `-removestock [ID]`\n';
                description += `Example: \`-removestock ${stock[0].id}\``;

                const embed = new EmbedBuilder()
                    .setColor(CONFIG.COLORS.ERROR)
                    .setTitle('🗑️ Remove Stock Item')
                    .setDescription(description)
                    .setFooter({ text: `${stock.length} items total` })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (interaction.customId === 'stock_view') {
                const stockData = formatStockEmbed(stock);
                
                const embed = new EmbedBuilder()
                    .setColor(stockData.color)
                    .setTitle(stockData.title)
                    .setDescription(stockData.description)
                    .setFooter({ text: stockData.footer })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        // MODAL SUBMITS
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'verification_modal') {
                const robloxUsername = interaction.fields.getTextInputValue('roblox_username').trim();

                const robloxUser = await getRobloxUserByUsername(robloxUsername);

                if (!robloxUser) {
                    return interaction.reply({
                        content: `❌ Roblox user "**${robloxUsername}**" not found!\n\nCheck spelling!`,
                        ephemeral: true
                    });
                }

                const verificationCode = generateVerificationCode();
                verificationCodes.set(interaction.user.id, verificationCode);

                const thumbnail = await getRobloxThumbnail(robloxUser.id);

                const embed = new EmbedBuilder()
                    .setColor(CONFIG.COLORS.WARNING)
                    .setAuthor({ 
                        name: '🔐 VERIFICATION IN PROGRESS',
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTitle('Almost There!')
                    .setDescription(
                        '**Found your account!**\n\n' +
                        '> **Username:** ' + robloxUser.name + '\n' +
                        '> **Display Name:** ' + robloxUser.displayName + '\n' +
                        '> **ID:** ' + robloxUser.id + '\n\n' +
                        '**Next Step - Copy this code:**\n\n' +
                        '```\n' + verificationCode + '\n```\n\n' +
                        '**How to add it:**\n' +
                        '> 1. Click button below for Roblox settings\n' +
                        '> 2. Go to Profile → About section\n' +
                        '> 3. **📱 Long press code above to copy!**\n' +
                        '> 4. Paste in About section\n' +
                        '> 5. Save\n' +
                        '> 6. Click **Verify Me!**\n\n' +
                        '```fix\n' +
                        '💡 MOBILE: Long press the code to copy!\n' +
                        '```\n\n' +
                        '**Code tagged by Roblox? Click "Reroll"!**'
                    )
                    .setThumbnail(thumbnail)
                    .setFooter({ text: 'Code: ' + verificationCode })
                    .setTimestamp();

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('📝 Open Roblox Settings')
                            .setStyle(ButtonStyle.Link)
                            .setURL('https://www.roblox.com/my/account#!/info'),
                        new ButtonBuilder()
                            .setCustomId(`verify_check_${robloxUsername}`)
                            .setLabel('✅ I Added It - Verify Me!')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('🔐'),
                        new ButtonBuilder()
                            .setCustomId(`verify_reroll_${robloxUsername}`)
                            .setLabel('🔄 Reroll Code')
                            .setStyle(ButtonStyle.Secondary)
                    );

                return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            }

            if (interaction.customId === 'stock_add_modal') {
                const brainrot = interaction.fields.getTextInputValue('brainrot_name');
                const mutations = interaction.fields.getTextInputValue('mutations');
                const priceStr = interaction.fields.getTextInputValue('price_usd');

                const price = parseFloat(priceStr);
                if (isNaN(price) || price <= 0) {
                    return interaction.reply({
                        content: '❌ Invalid price! Must be a positive number.\n\nExample: `5.99` or `10.00`',
                        ephemeral: true
                    });
                }

                const robuxInfo = convertUSDtoRobux(price);

                const newItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    brainrot: brainrot,
                    mutations: mutations,
                    price: price,
                    listedAt: Date.now(),
                    listedBy: interaction.user.id
                };

                stock.push(newItem);
                saveStock(stock);

                const embed = new EmbedBuilder()
                    .setColor(CONFIG.COLORS.SUCCESS)
                    .setTitle('✅ Item Added to Stock!')
                    .setDescription(
                        '```\n' +
                        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                        '         NEW LISTING CREATED\n' +
                        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                        '```\n\n' +
                        `**🔥 Brainrot:** ${brainrot}\n` +
                        `**🧬 Mutations:** ${mutations}\n\n` +
                        `**💵 USD Price:** $${price.toFixed(2)}\n` +
                        `**💎 Robux Price:** ${robuxInfo.robuxNeeded.toLocaleString()} R$\n` +
                        `> *Buyer pays: ${robuxInfo.robuxNeeded.toLocaleString()} R$*\n` +
                        `> *You receive: ${robuxInfo.youReceive.toLocaleString()} R$ (after 30% tax)*\n\n` +
                        `**🆔 Item ID:** \`${newItem.id}\`\n` +
                        `**📅 Listed:** <t:${Math.floor(newItem.listedAt / 1000)}:R>\n\n` +
                        '```fix\n' +
                        'Now visible to everyone in -stock!\n' +
                        '```\n\n' +
                        '**To remove later:** `-removestock ${newItem.id}`'
                    )
                    .setFooter({ text: `Listed by ${interaction.user.username}` })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

    } catch (error) {
        console.error('[INTERACTION ERROR]:', error);
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: '❌ Error occurred!', ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ Error occurred!', ephemeral: true });
            }
        } catch (e) {}
    }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

client.on('error', error => {
    console.error('[CLIENT ERROR]:', error);
});

process.on('unhandledRejection', error => {
    console.error('[UNHANDLED REJECTION]:', error);
});

// ============================================================================
// LOGIN
// ============================================================================

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('[LOGIN ERROR]:', error);
    process.exit(1);
});
