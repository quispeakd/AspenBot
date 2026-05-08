require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
} = require('discord.js');

const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    NoSubscriberBehavior,
    entersState,
    VoiceConnectionStatus,
    StreamType
} = require('@discordjs/voice');

const { spawn } = require('child_process');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const ASPEN_STREAM =
'https://24283.live.streamtheworld.com/ASPENAAC.aac';

let connection;
let player;

async function playAspen(voiceChannel) {

    if (connection) {
        connection.destroy();
    }

    connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false
    });

    try {
        await entersState(
            connection,
            VoiceConnectionStatus.Ready,
            20000
        );
    } catch (error) {
        console.log(error);
        return false;
    }

    const ffmpeg = spawn('ffmpeg', [
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5',

        '-i',
        ASPEN_STREAM,

        '-f', 's16le',
        '-ar', '48000',
        '-ac', '2',
        'pipe:1'
    ]);

    const resource = createAudioResource(ffmpeg.stdout, {
        inputType: StreamType.Raw
    });

    player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Play
        }
    });

    player.on('error', error => {
        console.log(error);
    });

    player.play(resource);

    connection.subscribe(player);

    return true;
}
client.once('ready', async () => {

    console.log(`Bot conectado como ${client.user.tag}`);
   
  });

client.on('messageCreate', async message => {

    if (message.author.bot) return;

    // =========================
    // !aspen
    // =========================

    if (message.content === '!aspen') {

        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return message.reply(
                'Entrá a un canal de voz primero.'
            );
        }

        // Si ya está conectado al mismo canal
        if (
            connection &&
            connection.joinConfig.channelId === voiceChannel.id
        ) {
            return message.reply(
                '📻 Aspen ya está sonando pichón.'
            );
        }

        const ok = await playAspen(voiceChannel);

        if (ok) {
            message.reply(
                '📻 Reproduciendo Aspen 102.3'
            );
        } else {
            message.reply(
                'No pude conectarme.'
            );
        }
    }

  
    // =========================
    // !chauaspen
    // =========================

    if (message.content === '!chauaspen') {

        if (player) {
            player.stop();
        }

        if (connection) {
            connection.destroy();
            connection = null;
        }

        message.reply(
            '👋 Aspen desconectado.'
        );
    }
});
client.login(process.env.TOKEN);