import {expectType} from 'tsd';
import filenamify, {filenamifyPath} from './index.js';

expectType<string>(filenamify('<foo/bar>'));
expectType<string>(filenamify('foo:"bar"', {replacement: '🐴'}));
expectType<string>(filenamifyPath('/some/!path'));
