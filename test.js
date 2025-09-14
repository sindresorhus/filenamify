import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'ava';
import filenamify, {filenamifyPath} from './index.js';

const directoryName = path.dirname(fileURLToPath(import.meta.url));

test('filenamify()', t => {
	t.is(filenamify('foo/bar'), 'foo!bar');
	t.is(filenamify('foo//bar'), 'foo!bar');
	t.is(filenamify('//foo//bar//'), '!foo!bar!');
	t.is(filenamify(String.raw`foo\\\bar`), 'foo!bar');
	t.is(filenamify('foo/bar', {replacement: '🐴🐴'}), 'foo🐴🐴bar');
	t.is(filenamify('////foo////bar////', {replacement: '(('}), '((foo((bar((');
	t.is(filenamify('foo\u0000bar'), 'foo!bar');
	t.is(filenamify('.'), '!');
	t.is(filenamify('..'), '!');
	t.is(filenamify('./'), '!');
	t.is(filenamify('../'), '!');
	t.is(filenamify('!.foo'), '!.foo');
	t.is(filenamify('foo.!'), 'foo.!');
	t.is(filenamify('foo.bar.'), 'foo.bar');
	t.is(filenamify('foo.bar..'), 'foo.bar');
	t.is(filenamify('foo.bar...'), 'foo.bar');
	t.is(filenamify('con'), 'con!');
	t.is(filenamify('foo/bar/nul'), 'foo!bar!nul');
	t.is(filenamify('con', {replacement: '🐴🐴'}), 'con🐴🐴');
	t.is(filenamify('c/n', {replacement: 'o'}), 'cono');
	t.is(filenamify('c/n', {replacement: 'con'}), 'cconn');
	t.is(filenamify('.dotfile'), '.dotfile');
	t.is(filenamify('my <file name-', {replacement: '-'}), 'my -file name-');
	t.is(filenamify('--<abc->>>--', {replacement: '-'}), '---abc----');
	t.is(filenamify('-<<abc>-', {replacement: '-'}), '--abc--');
	t.is(filenamify('my <file name<', {replacement: '-'}), 'my -file name-');
	t.is(filenamify('my <file name<'), 'my !file name!');
});

test('filenamifyPath()', t => {
	t.is(path.basename(filenamifyPath(path.join(directoryName, 'foo:bar'))), 'foo!bar');
	t.is(
		path.basename(filenamifyPath(path.join(directoryName, 'This? This is very long filename that will lose its extension when passed into filenamify, which could cause issues.csv'))),
		'This! This is very long filename that will lose its extension when passed into filenamify, which.csv',
	);
	// Test trailing spaces/periods with filenamifyPath
	t.is(path.basename(filenamifyPath(path.join(directoryName, 'foo. '))), 'foo');
	t.is(path.basename(filenamifyPath(path.join(directoryName, 'bar ...'))), 'bar');
});

test('filenamify length', t => {
	// Basename length: 152
	const filename = 'this/is/a/very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_long_filename.txt';
	t.is(filenamify(path.basename(filename)), 'very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_v.txt');
	t.is(
		filenamify(path.basename(filename), {maxLength: 180}),
		'very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_long_filename.txt',
	);

	// File extension longer than `maxLength` - base gets truncated to 0
	t.is(filenamify('foo.asdfghjkl', {maxLength: 5}), '.asdfghjkl');

	// Basename length: 148
	const filenameNoExt = 'very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_long_filename';
	t.is(filenamify(filenameNoExt), 'very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_');
	t.is(filenamify(filenameNoExt, {maxLength: 20}), 'very_very_very_very_');
	t.is(filenamify('.asdfghjkl', {maxLength: 2}), '.asdfghjkl');
});

test('grapheme-aware truncation', t => {
	// Test emoji sequences that should not be split
	t.is(filenamify('👨‍👩‍👧‍👦👨‍👩‍👧‍👦👨‍👩‍👧‍👦', {maxLength: 20}), '👨‍👩‍👧‍👦');
	t.is(filenamify('test👨‍👩‍👧‍👦.txt', {maxLength: 12}), 'test.txt');

	// Test surrogate pairs (mathematical bold capital A)
	t.is(filenamify('𝐀𝐀𝐀𝐀𝐀𝐀𝐀𝐀𝐀𝐀𝐀𝐀𝐀𝐀𝐀𝐀𝐀𝐀𝐀𝐀', {maxLength: 10}), '𝐀𝐀𝐀𝐀𝐀');

	// Test combining characters
	t.is(filenamify('é́é́é́é́é́é́é́é́é́é́', {maxLength: 10}), 'é́é́é́é́é́');

	// Test flag emojis (regional indicator symbols)
	t.is(filenamify('🇺🇸🇬🇧🇫🇷🇩🇪🇯🇵🇨🇳🇰🇷🇮🇹🇪🇸🇨🇦', {maxLength: 12}), '🇺🇸🇬🇧🇫🇷');

	// Test with extension and grapheme clusters - emoji families are 11 chars each
	t.is(filenamify('👨‍👩‍👧‍👦👨‍👩‍👧‍👦👨‍👩‍👧‍👦.txt', {maxLength: 15}), '👨‍👩‍👧‍👦.txt');
	t.is(filenamify('test👨‍👩‍👧‍👦👨‍👩‍👧‍👦.txt', {maxLength: 30}), 'test👨‍👩‍👧‍👦👨‍👩‍👧‍👦.txt');
});

test('Unicode normalization', t => {
	// Test NFC normalization (é vs e + combining acute)
	const decomposed = 'café'; // E + combining acute
	const precomposed = 'café'; // É as single character
	t.is(filenamify(decomposed), filenamify(precomposed));

	// Test that normalization happens before length check
	t.is(filenamify('caféabc', {maxLength: 6}), 'caféab');
});

test('edge cases', t => {
	// Empty string
	t.is(filenamify(''), '!');

	// Only reserved characters
	t.is(filenamify('///'), '!');
	t.is(filenamify('<<<>>>'), '!');

	// Replacement validation
	t.throws(() => filenamify('test', {replacement: '<'}), {message: 'Replacement string cannot contain reserved filename characters'});
	t.throws(() => filenamify('test', {replacement: '\u0000'}), {message: 'Replacement string cannot contain reserved filename characters'});

	// Extension exactly at maxLength
	t.is(filenamify('test.txt', {maxLength: 8}), 'test.txt');

	// Extension longer than maxLength - base truncated to 0
	t.is(filenamify('a.verylongextension', {maxLength: 5}), '.verylongextension');

	// No extension, exact maxLength
	t.is(filenamify('exact', {maxLength: 5}), 'exact');

	// Windows reserved names with different cases
	t.is(filenamify('CON'), 'CON!');
	t.is(filenamify('con'), 'con!');
	t.is(filenamify('CoN'), 'CoN!');
});

test('repeated reserved characters', t => {
	// Test that consecutive reserved characters are collapsed
	t.is(filenamify('foo<<<<bar', {replacement: '!'}), 'foo!bar');
	t.is(filenamify('foo::::bar', {replacement: '!'}), 'foo!bar');
	t.is(filenamify('foo////bar', {replacement: '!'}), 'foo!bar');

	// Test with empty replacement
	t.is(filenamify('foo<<<<bar', {replacement: ''}), 'foobar');
	t.is(filenamify('foo::::bar', {replacement: ''}), 'foobar');
});

test('control characters and Unicode', t => {
	// Test bidirectional control characters (security issue #39)
	t.is(filenamify('bar\u202Ecod.bat'), 'bar!cod.bat');
	t.is(filenamify('hello\u202Dworld'), 'hello!world');
	t.is(filenamify('test\u202A\u202B\u202C'), 'test!!!');

	// Test various control characters
	t.is(filenamify('foo\u0000bar'), 'foo!bar'); // Null character
	t.is(filenamify('foo\u007Fbar'), 'foo!bar'); // Delete character
	t.is(filenamify('foo\u0080bar'), 'foo!bar'); // C1 control
	t.is(filenamify('foo\u200Bbar'), 'foo!bar'); // Zero-width space
	t.is(filenamify('foo\uFEFFbar'), 'foo!bar'); // BOM
	t.is(filenamify('foo\u2028bar'), 'foo!bar'); // Line separator
	t.is(filenamify('foo\u2029bar'), 'foo!bar'); // Paragraph separator

	// Test Unicode whitespace normalization
	t.is(filenamify('foo\u00A0bar'), 'foo bar'); // Non-breaking space
	t.is(filenamify('foo\u2000bar'), 'foo bar'); // En quad
	t.is(filenamify('foo\u3000bar'), 'foo bar'); // Ideographic space
	t.is(filenamify('foo  \u00A0  \u2000  bar'), 'foo        bar'); // Multiple Unicode spaces normalized but regular spaces preserved
	t.is(filenamify('foo\t\n\rbar'), 'foo bar'); // Tab, newline, carriage return

	// Combined test with control chars and reserved chars
	t.is(filenamify('foo\u202E/bar:baz\u200B.txt'), 'foo!!bar!baz!.txt');
});

test('replacement validation', t => {
	// Test that control characters in replacement throw error
	t.throws(() => filenamify('test', {replacement: '\u0000'}), {message: 'Replacement string cannot contain reserved filename characters'});
	t.throws(() => filenamify('test', {replacement: '\u202E'}), {message: 'Replacement string cannot contain reserved filename characters'});
	t.throws(() => filenamify('test', {replacement: 'a\u200Bb'}), {message: 'Replacement string cannot contain reserved filename characters'});
});

test('combined transformations', t => {
	// Test NFC normalization + control chars + trailing spaces + truncation
	const input = 'café\u202E\u200B...  ';
	t.is(filenamify(input), 'café!!');

	// With maxLength
	const longInput = 'test\u202E\u200B' + 'x'.repeat(100) + '...  ';
	t.is(filenamify(longInput, {maxLength: 10}), 'test!!' + 'x'.repeat(4));

	// Everything problematic - control chars get replaced, then trailing dots/spaces removed
	t.is(filenamify('\u202E\u200B\u0000...   '), '!!!');
	t.is(filenamify('   \u200B\u202E   ', {replacement: 'x'}), '   xx'); // Leading spaces preserved
});

test('Windows reserved names edge cases', t => {
	// Reserved names without extensions get suffix
	t.is(filenamify('CON'), 'CON!');
	t.is(filenamify('con'), 'con!');
	t.is(filenamify('Com'), 'Com'); // Mixed case not reserved

	// With extensions they're fine
	t.is(filenamify('CON.txt'), 'CON.txt');
	t.is(filenamify('con.txt'), 'con.txt');

	// With numbers
	t.is(filenamify('COM1'), 'COM1!');
	t.is(filenamify('LPT9'), 'LPT9!');
	t.is(filenamify('COM0'), 'COM0!'); // COM0 is also reserved
});

test('replacement edge cases', t => {
	// Empty replacement
	t.is(filenamify('foo/bar', {replacement: ''}), 'foobar');
	t.is(filenamify('///', {replacement: ''}), ''); // Empty when replacement is empty

	// Zero-width joiner should be allowed in replacement
	t.is(filenamify('foo/bar', {replacement: '\u200D'}), 'foo‍bar');

	// Multiple character replacement
	t.is(filenamify('a/b/c', {replacement: '--'}), 'a--b--c');
});

test('file extension edge cases', t => {
	// Multiple dots - last dot is extension separator
	t.is(filenamify('file.backup.old.txt', {maxLength: 15}), 'file.backup.txt');
	t.is(filenamify('file.backup.old.txt', {maxLength: 10}), 'file.b.txt');

	// Extension-only files
	t.is(filenamify('.gitignore'), '.gitignore');
	t.is(filenamify('.gitignore...'), '.gitignore');

	// File with dots - last dot is extension
	t.is(filenamify('file.name.here', {maxLength: 10}), 'file..here'); // "file.name" + ".here"
	t.is(filenamify('file.name.here', {maxLength: 8}), 'fil.here'); // "fil" + ".here"

	// No dots
	t.is(filenamify('filename', {maxLength: 8}), 'filename');
	t.is(filenamify('verylongfilename', {maxLength: 8}), 'verylong');
});

test('trailing spaces and periods', t => {
	// Test removal of trailing spaces and periods
	t.is(filenamify('x.   ..'), 'x');
	t.is(filenamify('foo. '), 'foo');
	t.is(filenamify('foo '), 'foo');
	t.is(filenamify('foo.'), 'foo');
	t.is(filenamify('foo...'), 'foo');
	t.is(filenamify('foo   '), 'foo');
	t.is(filenamify('foo. . .'), 'foo');
	t.is(filenamify(' . . '), '!');
	t.is(filenamify('...'), '!');
	t.is(filenamify('   '), '!');

	// With custom replacement
	t.is(filenamify(' . . ', {replacement: 'x'}), 'x');
	t.is(filenamify('...', {replacement: 'y'}), 'y');

	// Combined with other transformations
	t.is(filenamify('foo/bar.  '), 'foo!bar');
	t.is(filenamify('foo:bar ...'), 'foo!bar');

	// Windows reserved names with trailing spaces/periods
	t.is(filenamify('con .'), 'con!');
	t.is(filenamify('aux...'), 'aux!');
	t.is(filenamify('nul  '), 'nul!');

	// With maxLength and trailing spaces/periods
	t.is(filenamify('hello world.  ', {maxLength: 11}), 'hello world');
	t.is(filenamify('test...', {maxLength: 4}), 'test');

	// Ensure internal spaces/periods are not removed
	t.is(filenamify('foo. .bar'), 'foo. .bar');
	t.is(filenamify('foo  bar'), 'foo  bar');
	t.is(filenamify('foo...bar'), 'foo...bar');
});
