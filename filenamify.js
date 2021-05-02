'use strict';
const trimRepeated = require('trim-repeated');
const filenameReservedRegex = require('filename-reserved-regex');
const stripOuter = require('strip-outer');

// Doesn't make sense to have longer filenames
const MAX_FILENAME_LENGTH = 100;

const reControlChars = /[\u0000-\u001f\u0080-\u009f]/g; // eslint-disable-line no-control-regex
const reRelativePath = /^\.+/;
const reTrailingPeriods = /\.+$/;

const filenamify = (string, options = {}) => {
	if (typeof string !== 'string') {
		throw new TypeError('Expected a string');
	}

	const replacement = options.replacement === undefined ? '!' : options.replacement;

	if (filenameReservedRegex().test(replacement) && reControlChars.test(replacement)) {
		throw new Error('Replacement string cannot contain reserved filename characters');
	}

	if (string.includes(replacement)) {
		return handleReplacementStringInUserInput(string, options);
	}

	string = string.replace(filenameReservedRegex(), replacement);
	string = string.replace(reControlChars, replacement);
	string = string.replace(reRelativePath, replacement);
	string = string.replace(reTrailingPeriods, '');

	if (replacement.length > 0) {
		string = trimRepeated(string, replacement);
		string = string.length > 1 ? stripOuter(string, replacement) : string;
	}

	string = filenameReservedRegex.windowsNames().test(string) ? string + replacement : string;
	string = string.slice(0, typeof options.maxLength === 'number' ? options.maxLength : MAX_FILENAME_LENGTH);

	return string;
};

/**
 * Handle user input string containing replacement string to a valid filename
 * @function handleReplacementStringInUserInput
 * @private
 * @param  {string} string  User input string that contains the replacement string
 * @param  {object} options 'replacement': String to use as replacement for reserved filename characters
 *                          'maxLength':  Truncate the filename to the given length.
 * @return {string} A valid filename
 * @summary
 * For any given input string that contains the replacement string, we can first split the input string by
 * the replacement string.
 * This will give us an array that contains zero or more substrings without any occurance of the replacement
 *   string.
 * Then for each substring that has a length strictly greater than zero, we apply the `filenamify` function
 *   to it with `options` to get the corresponding filenamified string.
 * To conform to the original procedure, we need to apply `stripOuter` function if and only if they pass
 *   the aforementioned condition, which is that the length is strictly greater than zero, to the first and
 *   the last `filenamified` substring with `replacement`.
 * For the rest of these substrings, we need to check whether the length of the `filenamified` substring is
 *   zero. If it is zero, then we assign the `replacement` string to the `filenamified` string.
 * Next, we push the `filenamified` string to the `filenamifiedSubstrings` array.
 * After all substrings are proceeded, we join all strings in the `filenamifiedSubstrings` array with
 *   the `replacement` string as the separator to get the expected output.
 */
const handleReplacementStringInUserInput = (string, options = {}) => {
	const replacement = options.replacement === undefined ? '!' : options.replacement;
	const substrings = string.split(replacement);
	const filenamifiedSubstrings = [];
	for (const [substringIndex, substring] of substrings.entries()) {
		let filenamified = '';
		if (substring.length > 0) {
			filenamified = filenamify(substring, options);
			if (substringIndex === substrings.length - 1 || substringIndex === 0) {
				filenamified = stripOuter(filenamified, replacement);
			} else if (filenamified.length === 0) {
				filenamified = replacement;
			}
		}

		filenamifiedSubstrings.push(filenamified);
	}

	return filenamifiedSubstrings.join(replacement);
};

module.exports = filenamify;

