import path from 'path';
import test from 'ava';
import m from './';

test('filnamify()', t => {
	t.is(m('foo/bar'), 'foo!bar');
	t.is(m('foo//bar'), 'foo!bar');
	t.is(m('//foo//bar//'), 'foo!bar');
	t.is(m('foo\\\\\\bar'), 'foo!bar');
	t.is(m('foo/bar', {replacement: '🐴🐴'}), 'foo🐴🐴bar');
	t.is(m('////foo////bar////', {replacement: '(('}), 'foo((bar');
	t.is(m('foo\x00bar'), 'foo!bar');
	t.is(m('.'), '!');
	t.is(m('..'), '!');
	t.is(m('./'), '!');
	t.is(m('../'), '!');
	t.is(m('con'), 'con!');
	t.is(m('foo/bar/nul'), 'foo!bar!nul');
	t.is(m('con', {replacement: '🐴🐴'}), 'con🐴🐴');
	t.is(m('c/n', {replacement: 'o'}), 'cono');
	t.is(m('c/n', {replacement: 'con'}), 'cconn');
});

test('filenamify.path()', t => {
	t.is(path.basename(m.path(path.join(__dirname, 'foo:bar'))), 'foo!bar');
});
