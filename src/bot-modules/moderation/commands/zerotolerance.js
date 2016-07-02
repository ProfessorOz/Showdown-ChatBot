/**
 * Commands File
 */

'use strict';

const Path = require('path');

const Text = Tools.get('text.js');
const Translator = Tools.get('translate.js');

const translator = new Translator(Path.resolve(__dirname, 'zerotolerance.translations'));

App.parser.addPermission('zerotolerance', {group: 'owner'});
App.parser.addPermission('checkzerotol', {group: 'driver'});

function tryGetRoomTitle(room) {
	if (App.bot.rooms[room]) {
		return Text.escapeHTML(App.bot.rooms[room].title || room);
	} else {
		return Text.escapeHTML(room);
	}
}

module.exports = {
	addzerotolerance: function () {
		if (!this.can('zerotolerance', this.room)) return this.replyAccessDenied('zerotolerance');
		let room = this.targetRoom;
		if (this.getRoomType(room) !== 'chat') return this.errorReply(translator.get('nochat', this.lang));
		const config = App.modules.moderation.system.data;
		if (!this.arg) return this.errorReply(this.usage({desc: 'user'}, {desc: 'min/low/normal/high/max', optional: true}));
		let user = Text.toId(this.args[0]);
		let level = Text.toId(this.args[1]) || 'normal';
		if (!user || !(level in {'min': 1, 'low': 1, 'normal': 1, 'high': 1, 'max': 1})) {
			return this.errorReply(this.usage({desc: 'user'}, {desc: 'min/low/normal/high/max', optional: true}));
		}
		if (user.length > 19) {
			return this.errorReply(translator.get(0, this.lang));
		}
		if (!config.zeroTolerance[room]) {
			config.zeroTolerance[room] = {};
		}
		config.zeroTolerance[room][user] = level;
		App.modules.moderation.system.db.write();
		App.logCommandAction(this);
		this.reply(translator.get(1, this.lang) + " __" + user + "__ " + translator.get(2, this.lang) +
			" (" + translator.get(3, this.lang) + ": " + level + ") " + translator.get(4, this.lang) + " <<" + room + ">>");
	},

	rmzerotolerance: function () {
		if (!this.can('zerotolerance', this.room)) return this.replyAccessDenied('zerotolerance');
		let room = this.targetRoom;
		if (this.getRoomType(room) !== 'chat') return this.errorReply(translator.get('nochat', this.lang));
		const config = App.modules.moderation.system.data;
		let user = Text.toId(this.args[0]);
		if (!user) return this.errorReply(this.usage({desc: 'user'}));
		if (!config.zeroTolerance[room] || !config.zeroTolerance[room][user]) {
			return this.errorReply(translator.get(1, this.lang) + " __" + user + "__ " + translator.get(5, this.lang) + " <<" + room + ">>");
		}
		delete config.zeroTolerance[room][user];
		if (Object.keys(config.zeroTolerance[room]).length === 0) {
			delete config.zeroTolerance[room];
		}
		App.modules.moderation.system.db.write();
		App.logCommandAction(this);
		this.reply(translator.get(1, this.lang) + " __" + user + "__ " + translator.get(6, this.lang) + " <<" + room + ">>");
	},

	viewzerotolerance: function () {
		if (!this.can('zerotolerance', this.room)) return this.replyAccessDenied('zerotolerance');
		let server = App.config.server.url;
		if (!server) {
			return this.pmReply(translator.get(7, this.lang));
		}
		let room = this.targetRoom;
		if (this.getRoomType(room) !== 'chat') return this.errorReply(translator.get('nochat', this.lang));
		const config = App.modules.moderation.system.data;
		let zt = config.zeroTolerance[room];
		if (!zt) {
			return this.pmReply(translator.get(8, this.lang) + " <<" + room + ">> " + translator.get(9, this.lang));
		}
		let html = '';
		html += '<html>';
		html += '<head><title>Zero tolerance configuration of ' + tryGetRoomTitle(room) + '</title></head>';
		html += '<body>';
		html += '<h3>Zero tolerance configuration of ' + tryGetRoomTitle(room) + '</h3>';
		html += '<ul>';
		let users = Object.keys(zt).sort();
		for (let i = 0; i < users.length; i++) {
			let user = users[i];
			html += '<li>';
			html += '<strong>' + user + '</strong>';
			html += '&nbsp;(Level: ' + zt[user] + ')';
			html += '</li>';
		}
		html += '</ul>';
		html += '</body>';
		html += '</html>';
		let key = App.data.temp.createTempFile(html);
		if (server.charAt(server.length - 1) === '/') {
			return this.pmReply(App.config.server.url + 'temp/' + key);
		} else {
			return this.pmReply(App.config.server.url + '/temp/' + key);
		}
	},

	checkzerotolerance: function () {
		let room = Text.toRoomid(this.args[0]);
		let user = Text.toId(this.args[1]) || this.byIdent.id;
		if (!user || !room) return this.errorReply(this.usage({desc: 'room'}, {desc: 'user', optional: true}));
		if (!App.bot.rooms[room] || this.getRoomType(room) !== 'chat') {
			return this.errorReply(translator.get(10, this.lang) + " __" + room + "__ " + translator.get(11, this.lang));
		}
		if (user.length > 19) {
			return this.errorReply(translator.get(0, this.lang));
		}
		if (user !== this.byIdent.id) {
			let group = App.bot.rooms[room].users[this.byIdent.id] || " ";
			let ident = Text.parseUserIdent(group + this.byIdent.id);
			if (!this.parser.can(ident, 'checkzerotol', room)) {
				return this.replyAccessDenied('checkzerotol');
			}
		}
		let config = App.modules.moderation.system.data;
		if (!config.zeroTolerance[room] || !config.zeroTolerance[room][user]) {
			this.pmReply(translator.get(1, this.lang) + " __" + user + "__ " + translator.get(12, this.lang) +
				" " + translator.get(4, this.lang) + " <<" + room + ">>");
		} else {
			let level = config.zeroTolerance[room][user];
			this.pmReply(translator.get(1, this.lang) + " __" + user + "__ " + translator.get(13, this.lang) +
				" (" + translator.get(3, this.lang) + ": " + level + ") " + translator.get(4, this.lang) + " <<" + room + ">>");
		}
	},
};