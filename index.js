/******** Written by Brianna Wegryn ********/

"use strict";

var async = require('async'),
	fs = require('fs'),
	request = require('request'),
	_ = require('underscore');

var TOKENPATTERN = /(?![a-z_]{20,})[A-Za-z0-9-_=]{20,}/gm;

var args = validateArguments();

if (args.delete) {
	fs.readFile('repo.list', function(err, data) {
	    if(err) throw err;
	    var repo_array = _.compact(data.toString().trim().split("\n"));
	    async.each(repo_array, function(repoName, callback) {
	    	request({
				method: 'DELETE',
				url: "https://api.github.com/repos/" + repoName,
				headers: {
					"Authorization": "bearer " + args.token,
					"Content-Type": "application/json",
			        "User-Agent": "node.js"
				},
				json: true
			}, function(error, response) {
				if (error || (response && response.statusCode != 204)) {
					callback(`Unable to delete ${repoName}. Details: ${error ? JSON.stringify(error) : JSON.stringify(response)}`);
				} else {
					callback();
				}
			});
	    }, function(err) {
	    	if (err) usage(err);
	    	console.log(`Successfully deleted ${repo_array.length} repositories.`);
	    	fs.unlink('repo.list', function(err) {
	    		if(err) throw err;
	    	});
	    });
	});
} else {
	request({
		method: 'GET',
		url: "https://api.github.com/user/repos?per_page=50",
		headers: {
			"Authorization": "bearer " + args.token,
			"Content-Type": "application/json",
	        "User-Agent": "node.js"
		},
		json: true
	}, function(error, response) {
		if (error || (response && response.statusCode != 200)) {
			usage(`Unable to retrieve your repositories. Details: ${error ? JSON.stringify(error) : JSON.stringify(response)}`);
		} else {
			var repo_array = _.pluck(response.body, "full_name");
			fs.writeFile('repo.list', repo_array.join("\n"), function(err, resp) {
				if (err) {
					usage(err);
				} else {
					console.log(`\nReview the repoistories in ${process.cwd()}/repo.list. Remove any repos from the list that you do not want deleted. Then rerun this script with -D to delete those remaining on the list.\n`);
				}
			});
		}
	});
}

function validateArguments() {
	if (process.argv.length < 3) {
		usage("Missing token argument.");
	}

	var args = {};
	process.argv.slice(2).forEach(function(argument) {
		switch (argument) {
			case "-D":
				args.delete = true;
				break;
			case (TOKENPATTERN.test(argument) ? argument : null):
				args.token = argument;
				break;
			default: 
				usage(`Invalid argument: ${argument}.`);
		}
	});

	if (!args.token) {
		usage("Missing token argument.");
	} else if (args.delete && !fs.existsSync("./repo.list")) {
		usage("Cannot run this script with -D (delete) before the preliminary run has been executed.");
	}
	return args;
}

function usage(error) {
	console.log("\nError: " + error);
	console.log("\n\n" +
		"Usage: node index <token> [arguments]" + "\n\n" +

		"Options:" + "\n" +
		"    -D        delete all repositories in repo.list" + "\n\n"
		);

	process.exit();
}