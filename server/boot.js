var Patterns = new Meteor.Collection("patterns");
var Anons = new Meteor.Collection("anons");
var Users = new Meteor.Collection("users");
var Admins = new Meteor.Collection("admins");

Meteor.startup(function () {
	for (var i in Meteor.default_server.method_handlers)
		if (i.match(/^\/[^\/]+\/[^\/]+/))
			Meteor.default_server.method_handlers[i] = function () {};

	Admins.remove({});
	Admins.insert({name: 'TomWij'});
});

Meteor.publish("patterns", function () {
  return Patterns.find({});
});