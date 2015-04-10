var assert = require('assert');


var html = require('../index');


describe('div-block', function (argument) {
	html.transcodeToIdentifiedHTML({
		src: path.join(__dirname, '/html-samples/template.html'),
		dest: path.join(__dirname, '/xpathed'),
		attribute: 'fabXPath'
	});
});
// var result = exports.buildXPathIdentifiedHtmlFromFile(path.join(__dirname, '/html-samples/template.html'));

