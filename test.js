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
	t.is(filenamify(''), '');

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
