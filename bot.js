/*
    Created by Joshua Brucker
*/

global.__basedir = __dirname;

const Discord = require('discord.js');

const fs = require('fs');
const path = require('path');
const DBL = require("dblapi.js");

const auth = require('./data/auth');
const utils = require('./utils/utils');
const db = require('./utils/db');
const voice = require('./utils/voice');
const commands = require('./commands/commands');
const dokiReact = require('./etc/doki-react');
const poemUpdate = require('./etc/poem-update');
const insult = require('./etc/insult.js');

const client = new Discord.Client();
const dbl = new DBL(auth.dbltoken, client);

process.on('unhandledRejection', (reason, p) => {
	if (reason.message != 'Missing Access' && reason.message != 'Missing Permissions') {
		console.log('Unhandled Rejection:', p);
	}
});

client.on('error', (error) => {
	console.log('Client Error: ', error);
});

dbl.on('error', e => {
	console.log('Discord Bots List Error: ', e);
})

process.on('SIGINT', (code) => {
    for (var id in voice.servers) {
        if (voice.servers.hasOwnProperty(id)) {
        	var vc = client.guilds.get(id).voiceConnection;
        	if (vc) {
        		vc.disconnect();
        	}
        }
    }

	process.exit();
});

client.on('ready', () => {
    setInterval(() => {
    	insult(client);
    }, 60000);

    console.log('I am ready!');
});

client.on('guildCreate', (guild) => {
    db.addGuild(guild.id, () => {
    	var message = ('Square up! Your true love has joined the server.'
	            + ' You can make a channel called `doki-poems` to track poems, and'
	            + ' use \`-help\` for more commands. Best of luck, dummies!');
    	
    	if (guild.systemChannel) {
	        guild.systemChannel.send(message);
    	} else {
    		var channel = utils.getMostPermissibleChannel(client, guild);
    		if (channel) {
    			channel.send(message);
    		}
    	}
    });
});

client.on('guildDelete', (guild) => {
	db.removeGuild(guild.id);
});

client.on('message', (message) => {
	if (message.guild) {
	    db.getGuild(message.guild.id, (guild) => {
	        var prefix = guild.prefix;

	        var content = message.content.toLowerCase();

	        if (content.substring(0, prefix.length) == prefix && content.length > 1) {
	            if (message.channel.name != 'doki-poems') {
	                var args = content.substring(prefix.length).split(' ');
	                var cmd = args[0].toLowerCase();
	                args = args.splice(1);

	                switch(cmd) {
	                    case 'doki':
	                        commands.doki(message, args);
	                        break;
	                    case 'waifu':
	                        commands.waifu(message, args);
	                        break;
	                    case 'moniquote':
	                        commands.moniquote(message, args);
	                        break;
	                    case 'nep':
	                        commands.nep(message, args);
	                        break;
	                    case 'poem':
	                        if (message.guild.channels.find((channel) => channel.name === 'doki-poems')) {
	                            commands.poem(message, args);
	                        } else {
	                            message.channel.send('Your server can make its own Doki Doki poems! All you have to do is create a channel titled'
	                                + ' \`doki-poems\` and DokiBot will add the first word posted each day to a poem.');
	                        }
	                        break;
	                    case "help":
	                        commands.help(message, args);
	                        break;
	                    case "ost":
	                        commands.ost(message, args);
	                        break;
	                    case 'prefix':
	                        commands.prefix(message, args);
	                        break;
	                    case 'anime':
	                        commands.anime(message, args);
	                        break;
	                    case 'neko':
	                    	commands.neko(message, args);
	                    	break;
	                }
	            }
	        }

	        poemUpdate(message, client);

	        var dokiReactChance = Math.floor(Math.random() * 2);
	        if (dokiReactChance == 1) {
	            dokiReact(message, client);
	        }
	    });
	}
});

client.login(auth.token);