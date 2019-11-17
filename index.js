'use strict';
const path = require('path');
const filenameReservedRegex = require('filename-reserved-regex');

// Doesn't make sense to have longer filenames
const MAX_FILENAME_LENGTH = 100;

const reRepeatedReservedChars = /([<>:"/\\|?*\x00-\x1F]){2,}/g; // eslint-disable-line no-control-regex, unicorn/no-hex-escape
const reOuterReservedChars = /^[<>:"/\\|?*\x00-\x1F]|[<>:"/\\|?*\x00-\x1F]$/g; // eslint-disable-line no-control-regex, unicorn/no-hex-escape
const reControlChars = /[\u0000-\u001f\u0080-\u009f]/g; // eslint-disable-line no-control-regex
const reRelativePath = /^\.+/;

const filenamify = (string, options = {}) => {
	if (typeof string !== 'string') {
		throw new TypeError('Expected a string');
	}

	const replacement = options.replacement === undefined ? '!' : options.replacement;

	if (filenameReservedRegex().test(replacement) && reControlChars.test(replacement)) {
		throw new Error('Replacement string cannot contain reserved filename characters');
	}

	if (replacement.length > 0) {
		string = trimRepeatedReservedChars(string);
		string = string.length > 1 ? stripOuterReservedChars(string) : string;
	}

	string = string.replace(filenameReservedRegex(), replacement);
	string = string.replace(reControlChars, replacement);
	string = string.replace(reRelativePath, replacement);

	string = filenameReservedRegex.windowsNames().test(string) ? string + replacement : string;
	string = string.slice(0, typeof options.maxLength === 'number' ? options.maxLength : MAX_FILENAME_LENGTH);

	return string;
};

filenamify.path = (filePath, options) => {
	filePath = path.resolve(filePath);
	return path.join(path.dirname(filePath), filenamify(path.basename(filePath), options));
};

const trimRepeatedReservedChars = str => str.replace(reRepeatedReservedChars, '$1');

const stripOuterReservedChars = str => str.replace(reOuterReservedChars, '');

module.exports = filenamify;
