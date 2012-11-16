/**
 * Builds a browser-specific version of the Imbo client
 */

var fs      = require('fs')
  , version = require('./package.json').version;

// Specify which files to include
var files = [
    'lib/browser.js',
    'lib/compat.js',
    'lib/url.js',
    'lib/client.js'
];

// Concatenate files
var js = '';
for (var i = 0; i < files.length; i++) {
    js += fs.readFileSync(__dirname + '/' + files[i], 'utf8') + "\n";
}

// Remove node-specific parts
js = js.replace(/\/\/\s+<Node>[\s\S]+?<\/Node>/g, '');
js = js.replace(/%Imbo.Version%/g, version);

// Put to filesystem
fs.writeFileSync(__dirname + '/dist/imbo.browser.js', js, 'utf8');
