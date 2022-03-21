const fs = require('fs');
const path = require('path');
const sass = require('sass');

const scan = (filterE = /./, filterM = /./,
		keys = ['scss', 'sass', 'style', 'main'],
		r = 'node_modules', i = 'package.json') => {
	// module paths
	const match = {};
	const mods = fs.readdirSync(r);
	for (const m of mods) if (m) {
		// module index
		const f = path.resolve(`${r}/${m}/${i}`);
		if (!filterM.test(m) || !fs.existsSync(f)) {
			continue;
		}
		// entry paths
		const index = require(f);
		const ents = keys.map(k => index[k]);
		for (const e of ents) if (e) {
			// entry match
			const f = path.resolve(`${r}/${m}/${e}`);
			if (!filterE.test(e) || !fs.existsSync(f)) {
				continue;
			}
			match[index.name] = f;
			break;
		}
	}
	return match;
};

const any_modules = scan(/./);
const css_modules = scan(/[.]css$/);
const scss_modules = scan(/[.]scss$/);

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
	},
	importers: [{
		// resolve SCSS node_modules (from SCSS)
		// and import now with sass
		findFileUrl: (url) => {
			if (url in scss_modules)
				return new URL(`file://${scss_modules[url]}`);
			if (url in css_modules)
				return null;
			if (url in any_modules)
				throw `"${url}" module has no s/css entries.` +
				`Needs "main", "style" or "sass" in it's package.json`;
			return null;
		}
	},{
		// resolve CSS node_modules (from SCSS)
		// and import later with esbuild
		canonicalize: (url) => {
			if (url in css_modules)
				return new URL(`file://${css_modules[url]}`);
			if (url in scss_modules)
				return null;
			if (url in any_modules)
				throw `"${url}" module has no s/css entries.` +
				`Needs "main", "style" or "sass" in it's package.json`;
			return null;
		},
		load: (url) => ({
			contents: `@import '${url.pathname}';`,
			syntax: 'css'
		})
	}]
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
		// resolve CSS node_modules (from CSS)
		// and import now with esbuild
		build.onResolve({filter: /./},
			(args, wlog = [], elog = []) => {
				if (args.kind !== 'import-rule' ||
					!/[.]css$/.test(args.importer))
					return null;
				if (args.path in css_modules)
					return {path: css_modules[args.path], warnings: wlog};
				if (args.path in scss_modules)
					throw `"${args.path}" cannot import scss into css.` +
					`Needs "main" or "style" css file in it's package.json`;
				if (args.path in any_modules)
					throw `"${args.path}" module has no s/css entries.` +
					`Needs "main", "style" or "sass" in it's package.json`;
				return null;
			}
		);
	}
};

