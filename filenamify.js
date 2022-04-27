import trimRepeated from 'trim-repeated';
import filenameReservedRegex, {windowsReservedNameRegex} from 'filename-reserved-regex';
import stripOuter from 'strip-outer';

// Doesn't make sense to have longer filenames
const MAX_FILENAME_LENGTH = 100;

const reControlChars = /[\u0000-\u001F\u0080-\u009F]/g; // eslint-disable-line no-control-regex
const reRelativePath = /^\.+(\\|\/)|^\.+$/;
const reTrailingPeriods = /\.+$/;

export default function filenamify(string, options = {}) {
	if (typeof string !== 'string') {
		throw new TypeError('Expected a string');
	}

	const replacement = options.replacement === undefined ? '!' : options.replacement;

	if (filenameReservedRegex().test(replacement) && reControlChars.test(replacement)) {
		throw new Error('Replacement string cannot contain reserved filename characters');
	}

	string = string.normalize('NFD');
	string = string.replace(reRelativePath, replacement);
	string = string.replace(filenameReservedRegex(), replacement);
	string = string.replace(reControlChars, replacement);
	string = string.replace(reTrailingPeriods, '');

	if (replacement.length > 0) {
		const startedWithDot = string[0] === '.';

		string = trimRepeated(string, replacement);
		string = string.length > 1 ? stripOuter(string, replacement) : string;

		// We removed the whole filename
		if (!startedWithDot && string[0] === '.') {
			string = replacement + string;
		}

		// We removed the whole extension
		if (string[string.length - 1] === '.') {
			string += replacement;
		}
	}

	string = windowsReservedNameRegex().test(string) ? string + replacement : string;
	const allowedLength = typeof options.maxLength === 'number' ? options.maxLength : MAX_FILENAME_LENGTH;
	if (string.length > allowedLength) {
		const extensionIndex = string.lastIndexOf('.');
		if (extensionIndex === -1) {
			string = string.slice(0, allowedLength);
		} else {
			const filename = string.slice(0, extensionIndex);
			const extension = string.slice(extensionIndex);
			string = filename.slice(0, Math.max(1, allowedLength - extension.length)) + extension;
		}
	}

	return string;
}
