const sass = require('sass');

const compile = (path, wlog, elog) => sass.compile(path, {
	logger: {
		// coerce warnings
		warn: (message, {span}) => wlog.push({
			text: message,
			location: span && {
				namespace: 'sass',
				lineText:  span.context,
				file:      span.url.pathname,
				line:      span.start.line,
				column:    span.start.column,
				length:    span.start.column - span.end.column
			}
		}),
		// coerce errors
		debug: (message, {span}) => elog.push({
			text: message,
			location: span && {
				namespace: 'sass',
				lineText:  span.context,
				file:      span.url.pathname,
				line:      span.start.line,
				column:    span.start.column,
				length:    span.start.column - span.end.column
			}
		})
	}
}).css;

module.exports = {
	name: 'sass',
	setup: build => {
		// identify files
		build.onResolve({filter: /[.]scss$/},
			(args, wlog = [], elog = []) => ({
				namespace: 'sass',
				path: args.path,
				warnings: wlog,
				errors: elog
			})
		);
		// compile files
		build.onLoad({filter: /[.]scss$/},
			(args, wlog = [], elog = []) => ({
				loader: 'css',
				resolveDir: args.path.replace(/[/][^/]+$/, ''),
				contents: compile(args.path, wlog, elog),
				warnings: wlog,
				errors: elog
			})
		);
	}
};

