declare namespace filenamify {
	interface Options {
		/**
		String to use as replacement for reserved filename characters.

		Cannot contain: `<` `>` `:` `"` `/` `\` `|` `?` `*`

		@default '!'
		*/
		readonly replacement?: string;
	}
}

declare const filenamify: {
	/**
	Convert a string to a valid filename.

	@example
	```
	import filenamify = require('filenamify');

	filenamify('<foo/bar>');
	//=> 'foo!bar'

	filenamify('foo:"bar"', {replacement: '🐴'});
	//=> 'foo🐴bar'
	```
	*/
	(string: string, options?: filenamify.Options): string;

	/**
	Convert the filename in a path a valid filename and return the augmented path.
	*/
	path(path: string, options?: filenamify.Options): string;

	// TODO: Remove this for the next major release
	default: typeof filenamify;
};

export = filenamify;
