// Easy maintenance.
function isAdmin(name) {
	return Admins.findOne({name: name}) !== undefined;
}

// Only use this for user specific actions (changing their password, ...), because we want anonymous contributions to be welcome too.
function isUser(session) {
	return Users.findOne({session: session}) !== undefined;
}

// Something only anonymous users can do, perhaps.
function isAnon(session) {
	return Anons.findOne({session: session}) !== undefined;
}

// Make sure the user isn't manually tampering with his sessions.
function isValidSession(session) {
	return isAnon(session) || isUser(session);
}

Meteor.methods({
	anonymous : function () {
		return Anons.insert({});
	},
	register: function (session, name, pass) {
		if (name.length < 5 || pass.length < 5)
			return 'length';

		if (Anons.find({name: name}).count() > 0)
			return 'exists';

		Anons.remove({_id : session});
		Users.insert({
			session : session,
			name : name,
			pass: pass,
			admin: isAdmin(name)
		});
		return Users.findOne({sesion: session});
	},
	login : function (name, pass) {
		var findOne = Users.findOne({name: name, pass: pass});
		if (findOne) {
			Users.update({session: findOne.session}, { $set : {admin: isAdmin(findOne.name)}});
			return Users.findOne({name: name, pass: pass});
		}
		else
			return null;
	},
	addPattern : function (session, name, description, pattern) {
		if (!isValidSession(session))
			return null;

		if (name == '' || description == '' || pattern == '')
			return null;

		return Patterns.insert({
			session: session,
			name: name,
			description: description,
			body: pattern
		});
	},
	removePattern : function (session, id) {
		if (!isUser(session))
			return;

		var name = Users.findOne({session: session}).name;

		if (!isAdmin(name))
			return;

		Patterns.remove({_id : id});
	}
});