const fs = require('fs');
const path = require('path');

module.exports = {
	name: 'file-url-token',
	setup: build => {
		build.onResolve({filter: /./}, args => {
			try {new URL(args.path);
				return null;
			} catch {}
			if (args.kind !== 'url-token') {
				return null;
			}
			if (args.path[0] === '#') {
				return null;
			}
			return {
				path: (new URL(`file://${args.resolveDir}/${args.path}`)).pathname,
				pluginData: args.kind
			};
		});
		build.onLoad({filter: /./}, args => {
			try {new URL(args.path);
				return null;
			} catch {}
			if (args.pluginData !== 'url-token') {
				return null;
			}
			return {
				contents: fs.readFileSync(args.path),
				loader: 'file'
			};
		});
	}
};

