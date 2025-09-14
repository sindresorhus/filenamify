import filenameReservedRegex, {windowsReservedNameRegex} from 'filename-reserved-regex';

// Doesn't make sense to have longer filenames
const MAX_FILENAME_LENGTH = 100;

const reRelativePath = /^\.+(\\|\/)|^\.+$/;
const reTrailingPeriods = /\.+$/;
const reControlChars = /[\u0000-\u001F\u0080-\u009F]/g; // eslint-disable-line no-control-regex
const reRepeatedReservedCharacters = /([<>:"/\\|?*\u0000-\u001F]){2,}/g; // eslint-disable-line no-control-regex

let segmenter;
function getSegmenter() {
	segmenter ??= new Intl.Segmenter(undefined, {granularity: 'grapheme'});
	return segmenter;
}

export default function filenamify(string, options = {}) {
	if (typeof string !== 'string') {
		throw new TypeError('Expected a string');
	}

	const replacement = options.replacement === undefined ? '!' : options.replacement;

	if (filenameReservedRegex().test(replacement) || reControlChars.test(replacement)) {
		throw new Error('Replacement string cannot contain reserved filename characters');
	}

	// Normalize to NFC first to stabilize byte representation and length calculations across platforms.
	string = string.normalize('NFC');

	if (replacement.length > 0) {
		string = string.replaceAll(reRepeatedReservedCharacters, '$1');
	}

	string = string.replace(reRelativePath, replacement);
	string = string.replace(filenameReservedRegex(), replacement);
	string = string.replaceAll(reControlChars, replacement);
	string = string.replace(reTrailingPeriods, '');

	if (replacement.length > 0) {
		const startedWithDot = string[0] === '.';

		// We removed the whole filename
		if (!startedWithDot && string[0] === '.') {
			string = replacement + string;
		}

		// We removed the whole extension
		if (string.at(-1) === '.') {
			string += replacement;
		}
	}

	string = windowsReservedNameRegex().test(string) ? string + replacement : string;
	const allowedLength = typeof options.maxLength === 'number' ? options.maxLength : MAX_FILENAME_LENGTH;
	if (string.length > allowedLength) {
		const extensionIndex = string.lastIndexOf('.');
		if (extensionIndex === -1) {
			string = truncateByGraphemeBudget(string, allowedLength);
		} else {
			const filename = string.slice(0, extensionIndex);
			const extension = string.slice(extensionIndex);
			const baseBudget = Math.max(0, allowedLength - extension.length);
			string = truncateByGraphemeBudget(filename, baseBudget) + extension;
		}
	}

	return string;
}

function truncateByGraphemeBudget(input, budget) {
	if (input.length <= budget) {
		return input;
	}

	let count = 0;
	let output = '';
	for (const {segment} of getSegmenter().segment(input)) {
		const next = count + segment.length;
		if (next > budget) {
			break;
		}

		output += segment;
		count = next;
	}

	return output;
}
