import {expectType} from 'tsd-check';
import filenamify from '.';

expectType<string>(filenamify('<foo/bar>'));
expectType<string>(filenamify('foo:"bar"', {replacement: '🐴'}));
expectType<string>(filenamify.path('/some/!path'));
