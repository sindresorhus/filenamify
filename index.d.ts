export interface Options {
	/**
	 * String to use as replacement for reserved filename characters.
	 *
	 * Cannot contain: `<` `>` `:` `"` `/` `\` `|` `?` `*`
	 *
	 * @default '!'
	 */
	readonly replacement?: string;
}

declare const filenamify: {
	/**
	 * Convert a string to a valid filename.
	 */
	(string: string, options?: Options): string;

	/**
	 * Convert the filename in a path a valid filename and return the augmented path.
	 */
	path(path: string, options?: Options): string;
};

export default filenamify;
