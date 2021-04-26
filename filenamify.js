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

	const getReplacementIndexSet = (string, replacement) => {
		const indexList = [];
		if (replacement.length === 0) {
			return indexList;
		}

		let position = 0;
		while (position < string.length) {
			const index = string.indexOf(replacement, position);
			if (index >= 0) {
				indexList.push(index);
				position = index + replacement.length;
			} else {
				break;
			}
		}

		return new Set(indexList);
	};

	const preIndexSet = getReplacementIndexSet(string, replacement);
	const incrementalReplacementSet = [];
	for (const incre of [filenameReservedRegex(), reControlChars, reRelativePath]) {
		for (const iterator of string.matchAll(incre)) {
			incrementalReplacementSet.push(iterator.index);
		}
	}

	const adjustedPreIndexSet = [...preIndexSet];
	for (const incIndex of incrementalReplacementSet) {
		for (let index = 0; index < adjustedPreIndexSet.length; index++) {
			if (adjustedPreIndexSet[index] > incIndex) {
				adjustedPreIndexSet[index] += replacement.length - 1;
			}
		}
	}

	string = string.replace(filenameReservedRegex(), replacement);
	string = string.replace(reControlChars, replacement);
	string = string.replace(reRelativePath, replacement);
	string = string.replace(reTrailingPeriods, '');

	if (replacement.length > 0) {
		const afterIndexSet = getReplacementIndexSet(string, replacement);
		const intersection = new Set([...adjustedPreIndexSet].filter(x => afterIndexSet.has(x)));
		let tmp = '';
		for (let index = 0; index < string.length;) {
			if (intersection.has(index)) {
				tmp += '/';
				index += replacement.length;
			} else {
				tmp += string[index];
				index += 1;
			}
		}

		string = trimRepeated(tmp, replacement);
		string = string.length > 1 ? stripOuter(string, replacement) : string;
		string = string.replace(/\//g, replacement);
	}

	string = filenameReservedRegex.windowsNames().test(string) ? string + replacement : string;
	string = string.slice(0, typeof options.maxLength === 'number' ? options.maxLength : MAX_FILENAME_LENGTH);

	return string;
};

module.exports = filenamify;
