import {expectType} from 'tsd';
import filenamify = require('.');

expectType<string>(filenamify('<foo/bar>'));
expectType<string>(filenamify('foo:"bar"', {replacement: '🐴'}));
expectType<string>(filenamify.path('/some/!path'));
