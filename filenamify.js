import trimRepeated from 'trim-repeated';
import filenameReservedRegex from 'filename-reserved-regex';
import stripOuter from 'strip-outer';

// Doesn't make sense to have longer filenames
const MAX_FILENAME_LENGTH = 100;

const reControlChars = /[\u0000-\u001F\u0080-\u009F]/g; // eslint-disable-line no-control-regex
const reRelativePath = /^\.+/;
const reTrailingPeriods = /\.+$/;

export default function filenamify(string, options = {}) {
	if (typeof string !== 'string') {
		throw new TypeError('Expected a string');
	}

	const replacement = options.replacement === undefined ? '!' : options.replacement;

	if (filenameReservedRegex().test(replacement) && reControlChars.test(replacement)) {
		throw new Error('Replacement string cannot contain reserved filename characters');
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
	const allowedLength = typeof options.maxLength === 'number' ? options.maxLength : MAX_FILENAME_LENGTH;
	if (allowedLength < string.length) {
		const extensionIndex = string.lastIndexOf('.');
		string = string.slice(0, Math.min(allowedLength, extensionIndex)) + string.slice(extensionIndex);
	}

	return string;
}
