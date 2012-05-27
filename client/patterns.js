///
/// Initialization
/// 

var Patterns = new Meteor.Collection("patterns");
Meteor.subscribe('patterns', function () {
	var Workspace = Backbone.Router.extend({
		routes: {
		  "" : "patterns",
		  ":id" : "pattern"
		},

		patterns : function () {
			showPage(Template.patterns);
		},

		pattern : function (id) {
			Session.set('current_pattern', id);
			showPage(Template.pattern);
		}

	});

	new Workspace();
	Backbone.history.start({pushState: true});
});

var converter = new Showdown.converter();

if (!Store.get('session')) {
	Meteor.call('anonymous', function (err, data) {
		Store.set('session', data);
	});
}

Store.get('session');
Store.get('login');

//
// Reactive Data Binding
//

Template.user.loggedIn = function () {
	return Session.get('login');
};

Template.user.userName = function () {
	return Session.get('login').name;
};

Template.user.error = function () {
	return Session.get('error');
};

Template.patterns.patterns = function () {
	return Patterns.find({});
};

Template.patterns.patterns = function () {
	return Patterns.find({});
}

Template.patterns.admin = function () {
	return Session.get('login') ? Session.get('login').admin : false;
}

//
// Events
//

Template.user.events = {
	'focus #user .name' : function () {
		$('#user .name').val('').css('color', '#000000');
	},
	'focus #user .pass' : function () {
		$('#user .pass').val('').css('color', '#000000');
	},
	'click #user .register' : function () {
		Meteor.call('register', Store.get('session'), $('#user .name').val(), (new jsSHA($('#user .pass').val(), "ASCII")).getHash("HEX"), function (err, data) {
			if (data === 'length')
				Session.set('error', 'Name and password need to be at least 5 characters, try again.');
			else if (data === 'exists')
			 	Session.set('error', 'That name may already be in use; try again.');
			else
				Store.set('login', data);
		});
	},
	'click #user .login' : function () {
		Meteor.call('login', $('#user .name').val(), (new jsSHA($('#user .pass').val(), "ASCII")).getHash("HEX"), function (err, data) {
			Store.set('error', data === null ? 'Your user name or password was incorrect, try again.' : '');
			if (data)
				Store.set('session', data.session);
			
			Store.set('login', data);

			Meteor.flush();
		});
	},
	'click #user .logout' : function () {
		Store.set('login', null);
		Store.set('session', null);

		Meteor.call('anonymous', function (err, data) {
			Store.set('session', data);
		});
	}
};

Template.entry.events = {
	'keyup #entry .pattern' : function () {
		Meteor.defer(sh_highlightDocument);
		$('#entry .preview').html(correctMarkdownCode($('#entry .pattern').val()));
	},
	'click #entry .addPattern' : function () {
		Meteor.call('addPattern',
			Store.get('session'),
			$('#entry .name').val(),
			$('#entry .description').val(),
			$('#entry .pattern').val()
		, function (err, data) {
			// TODO: Go to pattern page instead, perhaps even stub the pattern page if possible.

			Meteor.flush();
		});

		// TODO: Remove these two lines once the anonymous function above this has been filled in.
		$('#entry').css('display', 'none');
		$('#patterns').css('display', 'block');
	}
};

Template.patterns.events = {
	'click #patterns .addPattern' : function () {
		$('#entry').css('display', 'block');
		$('#patterns').css('display', 'none');
		$('#entry input.name, #entry input.description, #entry textarea').val('');
		$('#entry .preview').html('');
	},
	'click #patterns .removePattern' : function () {
		// TODO: This appears to be a bug?
		console.log(this);
		Meteor.call('removePattern', Store.get('session'), this._id);
	}
};

Template.pattern.pattern = function () {
	return Patterns.findOne({ _id : Session.get('current_pattern')});
};

var correctMarkdownCode = function (input) {
	var output = '';
	var process = $(converter.makeHtml(input.replace(/</g, '&lt;').replace(/>/g, '&gt;')))
	process.find('code').each(function () {
		if ($(this).html().match(/^[ ]*&amp;lt;/g))
			$(this).closest('pre').addClass('sh_html');
		else
			$(this).closest('pre').addClass('sh_javascript_dom');
		$(this).html(function (i, h) {
			return h.replace(/&amp;lt;/g, '&lt;').replace(/&amp;gt;/g, '&gt;');
		});
	});
	process.each(function () {
		output += $('<div></div>').append(this).html();
	});
	return output;
}

Template.pattern.body = function () {
	Meteor.defer(sh_highlightDocument);
	return correctMarkdownCode(Patterns.findOne({ _id : Session.get('current_pattern')}).body);
};

var showPage = function (page) {
	$('#page').html(Meteor.ui.render(function() { return page(); }));
};