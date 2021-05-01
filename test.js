import path from 'path';
import test from 'ava';
import filenamify from '.';

test('filnamify()', t => {
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
	t.is(filenamify('foo.bar.'), 'foo.bar');
	t.is(filenamify('foo.bar..'), 'foo.bar');
	t.is(filenamify('foo.bar...'), 'foo.bar');
	t.is(filenamify('con'), 'con!');
	t.is(filenamify('foo/bar/nul'), 'foo!bar!nul');
	t.is(filenamify('con', {replacement: '🐴🐴'}), 'con🐴🐴');
	t.is(filenamify('c/n', {replacement: 'o'}), 'cono');
	t.is(filenamify('c/n', {replacement: 'con'}), 'cconn');
	t.is(filenamify('!!!!!'), '!!!!!');
	t.is(filenamify('/!!///!!!!/////'), '!!!!!!!');
	t.is(filenamify('!!!!!//', {replacement: '!!'}), '!!!!!');
	t.is(filenamify('foofoo//', {replacement: 'foo'}), 'foofoo');
	t.is(filenamify('foofoo/foo/', {replacement: 'foo'}), 'foofoofoofoo');
});

test('filenamify.path()', t => {
	t.is(path.basename(filenamify.path(path.join(__dirname, 'foo:bar'))), 'foo!bar');
});

test('filenamify length', t => {
	// Basename length: 152
	const filename = 'this/is/a/very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_long_filename.txt';
	t.is(filenamify(path.basename(filename)), 'very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_');
	t.is(filenamify(path.basename(filename), {maxLength: 180}), 'very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_long_filename.txt');
});

