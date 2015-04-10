var path = require('path'),
	fs   = require('fs');

var htmlparser2 = require('htmlparser2'),
	domutils    = require('domutils'),
	_           = require('lodash');


/**
 * buildDOMFromHtmlFile
 * reads a file and attempts to build the DOM tree from its contents
 * @param  {String} filePath The path to the file
 * @param  {Object} options  Options to be passed to htmlparser2.DomHandler 
 *                           (see https://github.com/fb55/htmlparser2/blob/master/lib/index.js)
 * @return {Array}           The DOM tree for the given html
 */
function buildDOMFromHtmlFile(filePath, options) {

	// set some default values to the options object
	options = options || {};
	_.defaults(options, {

	})

	// read the data from the file
	var data = fs.readFileSync(filePath, {
		encoding: 'utf-8'
	})

	return htmlparser2.parseDOM(data, options);
};


/**
 * getNodeXPath Retrieves the node xPath
 * @param  {[type]} node [description]
 * @return {[type]}      [description]
 */
function getNodeXPath(node) {

	var paths = [];

	for (; node && node.type === 'tag'; node = node.parent) {
		var index = 0;

		for (var sibling = node.prev; sibling; sibling = sibling.prev) {
			if (sibling.type !== 'tag') {
				continue;
			} else if (sibling.name === node.name) {
				++index
			}
		}

		var pathIndex = (index ? "[" + (index+1) + "]" : "");
		paths.splice(0, 0, node.name + pathIndex);
	}

	return paths.length ? "/" + paths.join("/") : null;
}


// firebug code!!!!!
// COPIED FROM
// https://code.google.com/p/fbug/source/browse/branches/firebug1.6/content/firebug/lib.js?spec=svn12950&r=8828#1332
// getElementTreeXPath = function(element)
// {
//     var paths = [];

//     // Use nodeName (instead of localName) so namespace prefix is included (if any).
//     for (; element && element.nodeType == 1; element = element.parentNode)
//     {
//         var index = 0;
//         for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling)
//         {
//             // Ignore document type declaration.
//             if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
//                 continue;

//             if (sibling.nodeName == element.nodeName)
//                 ++index;
//         }

//         var tagName = element.nodeName.toLowerCase();
//         var pathIndex = (index ? "[" + (index+1) + "]" : "");
//         paths.splice(0, 0, tagName + pathIndex);
//     }

//     return paths.length ? "/" + paths.join("/") : null;
// };









/**
 * xPathIdentifyNodes Calculates the xPath of all tag nodes
 * BE CAREFUL, this alters the original object!
 * @param  {[type]} nodes [description]
 * @return {[type]}       [description]
 */
function xPathIdentifyNodes(nodes, options) {

	if (!options) {
		throw new Error('No options for xPathIdentifyNodes');
	}

	// the attribute at which identify the node
	var attribute = options.attribute;

	nodes.forEach(function (node) {

		// we are only interested in identifying tag nodes
		if (node.type === 'tag') {

			// [1] get the xPath for the node
			var nodeXPath = getNodeXPath(node);

			// [2] put the xPath as an attribute (if attribute is available)
			//     otherwise simply set the 'xPath' property onto the node
			if (attribute) {
				node.attribs[attribute] = nodeXPath;
			} else {
				node.xPath = nodeXPath;
			}

			// [2] check for children and loop through them
			if (node.children && node.children.length > 0) {
				// node has children
				xPathIdentifyNodes(node.children, options);
			}
		}
	});

	return nodes;
};



/**
 * buildXPathIdentifiedHtmlFromFile Converts an html file into an html-xpath-identified file
 * @param  {String} filePath Path from the source file.
 * @param  {Object} options  [description]
 * @return {[type]}          [description]
 */
function buildXPathIdentifiedHtmlFromFile(filePath, options) {
	options = options || {};
	_.defaults(options, {
		attribute: 'xPath'
	});

	// get nodes
	var nodes = buildDOMFromHtmlFile(filePath);

	// identify nodes
	var identifiedNodes = xPathIdentifyNodes(nodes, options);

	// stringify
	return domutils.getOuterHTML(identifiedNodes);
}


// export functions
exports.buildDOMFromHtmlFile = buildDOMFromHtmlFile;
exports.buildXPathIdentifiedHtmlFromFile = buildXPathIdentifiedHtmlFromFile;
exports.transcodeToIdentifiedHTML = function (options) {

	// [1] build html
	var finalHTML = buildXPathIdentifiedHtmlFromFile(options.src, options);

	// [2] check if dest is a directory
	var destPathStats = fs.statSync(options.dest);

	// [3] build dest file path
	destFilePath = destPathStats.isDirectory() ? 
					path.join(options.dest, path.basename(options.src)) :
					options.dest;

	// [4] write!
	fs.writeFileSync(destFilePath, finalHTML, {
		encoding: 'utf8'
	});
}

