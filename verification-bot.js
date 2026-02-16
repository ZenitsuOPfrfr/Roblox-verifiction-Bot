// ============================================================================
// ROBLOX VERIFICATION BOT - PREMIUM EDITION
// Beautiful UI, Fast verification, RoVer API integration
// ============================================================================

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const axios = require('axios');

console.log('🔐 Verification Bot - Starting...');

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
// CONFIGURATION - CUSTOMIZE THESE
// ============================================================================

const CONFIG = {
    // Role to give after verification (set this to your verified role ID)
    VERIFIED_ROLE_ID: '1429290360030499019',
    
    // Channel where verification happens (set to your verify channel ID)
    VERIFY_CHANNEL_ID: '1473088159440179392',
    
    // Embed colors
    COLORS: {
        PRIMARY: 0x00D9FF,      // Bright blue
        SUCCESS: 0x00FF88,      // Bright green
        ERROR: 0xFF4757,        // Bright red
        WARNING: 0xFFA502       // Orange
    },
    
    // Cooldown in seconds
    VERIFY_COOLDOWN: 10
};

// ============================================================================
// DATA STORAGE
// ============================================================================

const verifiedUsers = new Map(); // Discord ID -> Roblox data
const cooldowns = new Map();
const pendingVerifications = new Map();

// ============================================================================
// ROBLOX API FUNCTIONS
// ============================================================================

async function getRobloxUserByUsername(username) {
    try {
        // Get user ID from username
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

async function checkRobloxDescription(userId, discordId) {
    try {
        const user = await getRobloxUserById(userId);
        if (!user || !user.description) {
            return false;
        }
        
        // Check if description contains the Discord ID
        return user.description.includes(discordId);
    } catch (error) {
        return false;
    }
}

// ============================================================================
// BOT READY
// ============================================================================

client.once('ready', () => {
    console.log(`✅ Verification Bot Ready: ${client.user.tag}`);
    console.log(`🔐 Verified users: ${verifiedUsers.size}`);
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
            '**Verification is quick and easy!**\n' +
            '> Click the button below to start\n\n' +
            '```fix\n' +
            '⚡ INSTANT VERIFICATION • 100% SECURE\n' +
            '```'
        )
        .addFields(
            { 
                name: '📋 How It Works', 
                value: '> 1️⃣ Click **Start Verification**\n> 2️⃣ Enter your Roblox username\n> 3️⃣ Add your Discord ID to your Roblox profile\n> 4️⃣ Click **Verify** and you\'re done!', 
                inline: false 
            },
            { 
                name: '⏱️ Time Required', 
                value: '> Less than 30 seconds!', 
                inline: true 
            },
            { 
                name: '🔒 Privacy', 
                value: '> Your data is safe', 
                inline: true 
            }
        )
        .setFooter({ text: 'Click the button below to get started!' })
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

        // -verify command (creates the panel)
        if (content === '-verify') {
            // Check if user has admin
            if (!message.member.permissions.has('Administrator')) {
                return message.reply('❌ Only administrators can create verification panels!');
            }

            await createVerificationPanel(message.channel);
            
            // Delete the command message
            try {
                await message.delete();
            } catch (e) {}
            
            return;
        }

        // -unverify @user (admin only)
        if (content.startsWith('-unverify')) {
            if (!message.member.permissions.has('Administrator')) {
                return message.reply('❌ Admin only!');
            }

            const mentioned = message.mentions.users.first();
            if (!mentioned) {
                return message.reply('❌ Mention a user: `-unverify @user`');
            }

            // Remove verified role
            const member = await message.guild.members.fetch(mentioned.id);
            const verifiedRole = message.guild.roles.cache.get(CONFIG.VERIFIED_ROLE_ID);
            
            if (verifiedRole && member.roles.cache.has(CONFIG.VERIFIED_ROLE_ID)) {
                await member.roles.remove(verifiedRole);
                verifiedUsers.delete(mentioned.id);
                
                return message.reply(`✅ Unverified ${mentioned}`);
            } else {
                return message.reply(`❌ ${mentioned} is not verified!`);
            }
        }

        // -whois @user or -whois username
        if (content.startsWith('-whois')) {
            const args = content.split(' ').slice(1);
            if (args.length === 0) {
                return message.reply('❌ Usage: `-whois @user` or `-whois RobloxUsername`');
            }

            const mentioned = message.mentions.users.first();
            
            if (mentioned) {
                // Check Discord user
                const data = verifiedUsers.get(mentioned.id);
                
                if (!data) {
                    return message.reply(`❌ ${mentioned} is not verified!`);
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
                // Check Roblox username
                const robloxUser = await getRobloxUserByUsername(args.join(' '));
                
                if (!robloxUser) {
                    return message.reply('❌ Roblox user not found!');
                }

                // Find if they're verified in this server
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
                    .setTitle('🔍 Roblox User Information')
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

    } catch (error) {
        console.error('[MESSAGE ERROR]:', error);
    }
});

// ============================================================================
// INTERACTION HANDLER
// ============================================================================

client.on('interactionCreate', async (interaction) => {
    try {
        // Button handler
        if (interaction.isButton()) {
            if (interaction.customId === 'start_verification') {
                // Check cooldown
                const cooldown = cooldowns.get(interaction.user.id);
                if (cooldown && Date.now() - cooldown < CONFIG.VERIFY_COOLDOWN * 1000) {
                    const timeLeft = Math.ceil((CONFIG.VERIFY_COOLDOWN * 1000 - (Date.now() - cooldown)) / 1000);
                    return interaction.reply({
                        content: `⏰ Please wait ${timeLeft}s before verifying again!`,
                        ephemeral: true
                    });
                }

                // Check if already verified
                if (verifiedUsers.has(interaction.user.id)) {
                    const data = verifiedUsers.get(interaction.user.id);
                    return interaction.reply({
                        content: `✅ You're already verified as **${data.robloxUsername}**!\n\nNeed to re-verify? Contact a staff member.`,
                        ephemeral: true
                    });
                }

                // Show modal to enter Roblox username
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
                        '**Step-by-Step Guide:**\n\n' +
                        '**1️⃣ Click "Start Verification"**\n' +
                        '> A popup will appear\n\n' +
                        '**2️⃣ Enter Your Roblox Username**\n' +
                        '> Type your exact Roblox username\n\n' +
                        '**3️⃣ Add Code to Roblox Profile**\n' +
                        '> Go to Roblox.com → Settings → Profile\n' +
                        '> Add the code we give you to your "About" section\n\n' +
                        '**4️⃣ Click Verify**\n' +
                        '> We\'ll check your profile and verify you instantly!\n\n' +
                        '```fix\n' +
                        '💡 TIP: The code is your Discord ID\n' +
                        '```\n\n' +
                        '**Still stuck?**\n' +
                        '> Contact a staff member for help!'
                    )
                    .setFooter({ text: 'Average verification time: 30 seconds' })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (interaction.customId.startsWith('verify_check_')) {
                const robloxUsername = interaction.customId.split('_')[2];
                
                // Get Roblox user
                const robloxUser = await getRobloxUserByUsername(robloxUsername);
                
                if (!robloxUser) {
                    return interaction.reply({
                        content: '❌ Could not find your Roblox account. Please try again.',
                        ephemeral: true
                    });
                }

                // Check if description contains Discord ID
                const isValid = await checkRobloxDescription(robloxUser.id, interaction.user.id);
                
                if (!isValid) {
                    const embed = new EmbedBuilder()
                        .setColor(CONFIG.COLORS.ERROR)
                        .setTitle('❌ Verification Failed')
                        .setDescription(
                            '**Your Roblox profile doesn\'t have the verification code!**\n\n' +
                            '**To fix this:**\n' +
                            '> 1. Go to [Roblox.com](https://www.roblox.com)\n' +
                            '> 2. Click Settings → Profile\n' +
                            '> 3. In the "About" section, add: `' + interaction.user.id + '`\n' +
                            '> 4. Click Save\n' +
                            '> 5. Come back and click **Verify** again\n\n' +
                            '```fix\n' +
                            'Copy this: ' + interaction.user.id + '\n' +
                            '```'
                        )
                        .setFooter({ text: 'This usually takes less than 30 seconds!' })
                        .setTimestamp();

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('📝 Open Roblox Settings')
                                .setStyle(ButtonStyle.Link)
                                .setURL('https://www.roblox.com/my/account#!/info'),
                            new ButtonBuilder()
                                .setCustomId(`verify_check_${robloxUsername}`)
                                .setLabel('🔄 Try Again')
                                .setStyle(ButtonStyle.Primary)
                        );

                    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
                }

                // SUCCESS! Add verified role
                const member = await interaction.guild.members.fetch(interaction.user.id);
                const verifiedRole = interaction.guild.roles.cache.get(CONFIG.VERIFIED_ROLE_ID);
                
                if (verifiedRole) {
                    await member.roles.add(verifiedRole);
                }

                // Save verification data
                verifiedUsers.set(interaction.user.id, {
                    robloxId: robloxUser.id,
                    robloxUsername: robloxUser.name,
                    verifiedAt: Date.now()
                });

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
                        '**Your account has been linked!**\n\n' +
                        '> **Discord:** ' + interaction.user + '\n' +
                        '> **Roblox:** ' + robloxUser.name + '\n' +
                        '> **Roblox ID:** ' + robloxUser.id + '\n\n' +
                        '**You now have access to:**\n' +
                        '> ✅ All server channels\n' +
                        '> ✅ Trading & giveaways\n' +
                        '> ✅ Events & activities\n\n' +
                        '```fix\n' +
                        '🎉 Enjoy your stay!\n' +
                        '```'
                    )
                    .setThumbnail(thumbnail)
                    .setFooter({ text: `Verified: ${interaction.user.username}` })
                    .setTimestamp();

                return interaction.reply({ embeds: [successEmbed], ephemeral: true });
            }
        }

        // Modal handler
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'verification_modal') {
                const robloxUsername = interaction.fields.getTextInputValue('roblox_username').trim();

                // Validate username
                const robloxUser = await getRobloxUserByUsername(robloxUsername);

                if (!robloxUser) {
                    return interaction.reply({
                        content: `❌ Could not find Roblox user "**${robloxUsername}**"\n\nMake sure you typed your username correctly!`,
                        ephemeral: true
                    });
                }

                const thumbnail = await getRobloxThumbnail(robloxUser.id);

                const embed = new EmbedBuilder()
                    .setColor(CONFIG.COLORS.WARNING)
                    .setAuthor({ 
                        name: '🔐 VERIFICATION IN PROGRESS',
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTitle('Almost There!')
                    .setDescription(
                        '**We found your Roblox account!**\n\n' +
                        '> **Username:** ' + robloxUser.name + '\n' +
                        '> **Display Name:** ' + robloxUser.displayName + '\n' +
                        '> **ID:** ' + robloxUser.id + '\n\n' +
                        '**Next Step:**\n' +
                        '> Add this code to your Roblox profile "About" section:\n\n' +
                        '```\n' + interaction.user.id + '\n```\n\n' +
                        '**How to do it:**\n' +
                        '> 1. Click the button below to open Roblox settings\n' +
                        '> 2. Go to Profile → About section\n' +
                        '> 3. Paste the code above anywhere in your About\n' +
                        '> 4. Click Save\n' +
                        '> 5. Come back and click **Verify**\n\n' +
                        '```fix\n' +
                        '⏱️ This takes less than 30 seconds!\n' +
                        '```'
                    )
                    .setThumbnail(thumbnail)
                    .setFooter({ text: 'Your code: ' + interaction.user.id })
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
                            .setEmoji('🔐')
                    );

                return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            }
        }

    } catch (error) {
        console.error('[INTERACTION ERROR]:', error);
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred. Please try again!',
                    ephemeral: true
                });
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

client.on('warn', warning => {
    console.warn('[CLIENT WARNING]:', warning);
});

process.on('unhandledRejection', error => {
    console.error('[UNHANDLED REJECTION]:', error);
});

process.on('uncaughtException', error => {
    console.error('[UNCAUGHT EXCEPTION]:', error);
});

// ============================================================================
// LOGIN
// ============================================================================

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('[LOGIN ERROR]:', error);
    process.exit(1);
});
