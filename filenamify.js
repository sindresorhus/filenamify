import filenameReservedRegex, {windowsReservedNameRegex} from 'filename-reserved-regex';

// Doesn't make sense to have longer filenames
const MAX_FILENAME_LENGTH = 100;

const reRelativePath = /^\.+(\\|\/)|^\.+$/;
const reTrailingDotsAndSpaces = /[. ]+$/;

// Remove all problematic characters except zero-width joiner (\u200D) needed for emoji
const reControlChars = /[\p{Control}\p{Format}\p{Zl}\p{Zp}\uFFF0-\uFFFF]/gu;
const reControlCharsTest = /[\p{Control}\p{Format}\p{Zl}\p{Zp}\uFFF0-\uFFFF]/u;
const isZeroWidthJoiner = char => char === '\u200D';
const reRepeatedReservedCharacters = /([<>:"/\\|?*\u0000-\u001F]){2,}/g; // eslint-disable-line no-control-regex

// Normalize various Unicode whitespace characters to regular space
// Using specific characters instead of \s to avoid matching regular spaces
const reUnicodeWhitespace = /[\t\n\r\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+/g;

let segmenter;
function getSegmenter() {
	segmenter ??= new Intl.Segmenter(undefined, {granularity: 'grapheme'});
	return segmenter;
}

export default function filenamify(string, options = {}) {
	if (typeof string !== 'string') {
		throw new TypeError('Expected a string');
	}

	const replacement = options.replacement ?? '!';

	if (filenameReservedRegex().test(replacement) || [...replacement].some(char => reControlCharsTest.test(char) && !isZeroWidthJoiner(char))) {
		throw new Error('Replacement string cannot contain reserved filename characters');
	}

	// Normalize to NFC first to stabilize byte representation and length calculations across platforms.
	string = string.normalize('NFC');

	// Normalize Unicode whitespace to single spaces
	string = string.replaceAll(reUnicodeWhitespace, ' ');

	if (replacement.length > 0) {
		string = string.replaceAll(reRepeatedReservedCharacters, '$1');
	}

	string = string.replace(reRelativePath, replacement);
	string = string.replace(filenameReservedRegex(), replacement);
	string = string.replaceAll(reControlChars, char => isZeroWidthJoiner(char) ? char : replacement);

	// Trim trailing spaces and periods (Windows rule)
	string = string.replace(reTrailingDotsAndSpaces, '');

	// If the string is now empty, use replacement or default
	if (string.length === 0) {
		string = replacement;
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
