import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'ava';
import filenamify, {filenamifyPath} from './index.js';

const directoryName = path.dirname(fileURLToPath(import.meta.url));

test('filenamify()', t => {
	t.is(filenamify('foo/bar'), 'foo!bar');
	t.is(filenamify('foo//bar'), 'foo!bar');
	t.is(filenamify('//foo//bar//'), 'foo!bar');
	t.is(filenamify('foo\\\\\\bar'), 'foo!bar');
	t.is(filenamify('foo/bar', {replacement: '🐴🐴'}), 'foo🐴🐴bar');
	t.is(filenamify('////foo////bar////', {replacement: '(('}), 'foo((bar');
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
	t.is(filenamify('/path/to/file---name.ext', {replacement: '-'}), 'path-to-file-name.ext');
});

test('filenamifyPath()', t => {
	t.is(path.basename(filenamifyPath(path.join(directoryName, 'foo:bar'))), 'foo!bar');
	t.is(path.basename(filenamifyPath(path.join(directoryName, 'This? This is very long filename that will lose its extension when passed into filenamify, which could cause issues.csv'))),
		'This! This is very long filename that will lose its extension when passed into filenamify, which.csv');
});

test('filenamify length', t => {
	// Basename length: 152
	const filename = 'this/is/a/very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_long_filename.txt';
	t.is(filenamify(path.basename(filename)), 'very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_v.txt');
	t.is(filenamify(path.basename(filename), {maxLength: 180}), 'very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_long_filename.txt');

	// File extension longer than `maxLength`
	t.is(filenamify('foo.asdfghjkl', {maxLength: 5}), 'f.asdfghjkl');

	// Basename length: 148
	const filenameNoExt = 'very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_long_filename';
	t.is(filenamify(filenameNoExt), 'very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_');
	t.is(filenamify(filenameNoExt, {maxLength: 20}), 'very_very_very_very_');
	t.is(filenamify('.asdfghjkl', {maxLength: 2}), '.asdfghjkl');
});

test('filenamify condenseReplacements', t => {
	t.is(filenamify('/path/to/file---name.ext', {replacement: '-', preserveRepeatedReplacements: true}), 'path-to-file---name.ext');
	t.is(filenamify('/path/to/file---name.ext', {replacement: '-', preserveRepeatedReplacements: false}), 'path-to-file-name.ext');
});
