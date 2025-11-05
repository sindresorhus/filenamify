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

// For validating replacement string - only truly reserved characters, not trailing spaces/periods
const reReplacementReservedCharacters = /[<>:"/\\|?*\u0000-\u001F]/; // eslint-disable-line no-control-regex

// Normalize various Unicode whitespace characters to regular space
// Using specific characters instead of \s to avoid matching regular spaces
const reUnicodeWhitespace = /[\t\n\r\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+/g;

let segmenter;
function getSegmenter() {
	segmenter ??= new Intl.Segmenter(undefined, {granularity: 'grapheme'});
	return segmenter;
}

function truncateFilename(filename, maxLength) {
	if (filename.length <= maxLength) {
		return filename;
	}

	const extensionIndex = filename.lastIndexOf('.');

	// No extension - simple truncation
	if (extensionIndex === -1) {
		return truncateByGraphemeBudget(filename, maxLength);
	}

	// Has extension - preserve it and truncate base
	const base = filename.slice(0, extensionIndex);
	const extension = filename.slice(extensionIndex);
	const baseBudget = Math.max(0, maxLength - extension.length);
	const truncatedBase = truncateByGraphemeBudget(base, baseBudget);

	// Strip trailing spaces from base (not periods - they're not trailing in final filename)
	return truncatedBase.replace(/ +$/, '') + extension;
}

export default function filenamify(string, options = {}) {
	if (typeof string !== 'string') {
		throw new TypeError('Expected a string');
	}

	const replacement = options.replacement ?? '!';

	const hasReservedChars = reReplacementReservedCharacters.test(replacement);
	const hasControlChars = [...replacement].some(char => reControlCharsTest.test(char) && !isZeroWidthJoiner(char));

	if (hasReservedChars || hasControlChars) {
		throw new Error('Replacement string cannot contain reserved filename characters');
	}

	// Normalize to NFC first to stabilize byte representation and length calculations across platforms.
	string = string.normalize('NFC');

	// Normalize Unicode whitespace to single spaces
	string = string.replaceAll(reUnicodeWhitespace, ' ');

	if (replacement.length > 0) {
		string = string.replaceAll(reRepeatedReservedCharacters, '$1');
	}

	// Trim trailing spaces and periods (Windows rule) - do this BEFORE replacements
	// so they get stripped rather than replaced
	string = string.replace(reTrailingDotsAndSpaces, '');

	string = string.replace(reRelativePath, replacement);
	string = string.replace(filenameReservedRegex(), replacement);
	string = string.replaceAll(reControlChars, char => isZeroWidthJoiner(char) ? char : replacement);

	// Trim trailing spaces and periods again (in case replacement created new ones)
	string = string.replace(reTrailingDotsAndSpaces, '');

	// If the string is now empty, use replacement with trailing spaces/periods stripped
	if (string.length === 0) {
		string = replacement.replace(reTrailingDotsAndSpaces, '');
		// If still empty and replacement wasn't explicitly empty, use '!' as fallback
		if (string.length === 0 && replacement.length > 0) {
			string = '!';
		}
	}

	// Truncate before Windows reserved name check (truncation can create reserved names)
	const allowedLength = typeof options.maxLength === 'number' ? options.maxLength : MAX_FILENAME_LENGTH;
	string = truncateFilename(string, allowedLength);

	// Strip trailing spaces/periods after truncation (truncation can create them)
	string = string.replace(reTrailingDotsAndSpaces, '');

	// Check for Windows reserved names after truncation and stripping
	// Windows compatibility takes precedence over maxLength, so we add suffix even if it exceeds limit
	if (windowsReservedNameRegex().test(string)) {
		string += replacement;
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
