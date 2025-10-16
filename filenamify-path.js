import path from 'node:path';
import filenamify from './index.js';

export default function filenamifyPath(filePath, options) {
	filePath = path.resolve(filePath);
	return path.join(path.dirname(filePath), filenamify(path.basename(filePath), options));
}
