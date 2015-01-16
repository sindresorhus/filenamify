'use strict';
var trimRepeated = require('trim-repeated');
var filenameReservedRegex = require('filename-reserved-regex');
var stripOuter = require('strip-outer')

// doesn't make sense to have longer filenames
var MAX_FILENAME_LENGTH = 100;

module.exports = function (str, opts) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	opts = opts || {};

	var replacement = opts.replacement || '!';

	if (filenameReservedRegex().test(replacement)) {
		throw new Error('Replacement string cannot contain reserved filename characters');
	}

	str = str.replace(filenameReservedRegex(), replacement);

	if (replacement.length > 0) {
		str = trimRepeated(str, replacement);
		str = stripOuter(str, replacement);
	}

	str = str.slice(0, MAX_FILENAME_LENGTH);

	return str;
};
