'use strict';
var path = require('path');
var test = require('ava');
var filenamify = require('./');

test('filnamify()', function (t) {
	t.assert(filenamify('foo/bar') === 'foo!bar');
	t.assert(filenamify('foo//bar') === 'foo!bar');
	t.assert(filenamify('//foo//bar//') === 'foo!bar');
	t.assert(filenamify('foo\\\\\\bar') === 'foo!bar');
	t.assert(filenamify('foo/bar', {replacement: '🐴🐴'}) === 'foo🐴🐴bar');
	t.assert(filenamify('////foo////bar////', {replacement: '(('}) === 'foo((bar');
	t.assert(filenamify('foo\x00bar') === 'foo!bar');
	t.assert(filenamify('.') === '!');
	t.assert(filenamify('..') === '!');
	t.assert(filenamify('./') === '!');
	t.assert(filenamify('../') === '!');
	t.end();
});

test('filenamify.path()', function (t) {
	t.assert(path.basename(filenamify.path(path.join(__dirname, 'foo:bar'))) === 'foo!bar');
	t.end();
});
