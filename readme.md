# filenamify [![Build Status](https://travis-ci.org/sindresorhus/filenamify.svg?branch=master)](https://travis-ci.org/sindresorhus/filenamify)

> Convert a string to a valid safe filename

On Unix-like systems `/` is reserved and [`<>:"/\|?*`](http://msdn.microsoft.com/en-us/library/aa365247%28VS.85%29#naming_conventions) on Windows.


## Install

```
$ npm install filenamify
```


## Usage

```js
const filenamify = require('filenamify');

filenamify('<foo/bar>');
//=> 'foo!bar'

filenamify('foo:"bar"', {replacement: '🐴'});
//=> 'foo🐴bar'
```


## API

### filenamify(string, [options])

Convert a string to a valid filename.

### filenamify.path(path, [options])

Convert the filename in a path a valid filename and return the augmented path.

#### options

Type: `Object`

##### replacement

Type: `string`<br>
Default: `'!'`

String to use as replacement for reserved filename characters.

Cannot contain: `<` `>` `:` `"` `/` `\` `|` `?` `*`


##### maxFilenameLength

Type: `boolean`<br>
Default: `100`

The filename is truncated to this length.


## Related

- [filenamify-cli](https://github.com/sindresorhus/filenamify-cli) - CLI for this module
- [filenamify-url](https://github.com/sindresorhus/filenamify-url) - Convert a URL to a valid filename
- [valid-filename](https://github.com/sindresorhus/valid-filename) - Check if a string is a valid filename
- [unused-filename](https://github.com/sindresorhus/unused-filename) - Get a unused filename by appending a number if it exists
- [slugify](https://github.com/sindresorhus/slugify) - Slugify a string


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
