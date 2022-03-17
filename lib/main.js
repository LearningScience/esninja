const fs = require('fs');
const path = require('path');
const es = require('esbuild');

const scan = (dirs, filterF = /./, filterD = /./) => {
	const file = [];
	// dir paths
	for (const dir of dirs) {
		const ents = fs.readdirSync(dir);
		// ent paths
		for (const ent of ents) {
			const path = `${dir}/${ent}`;
			// collect
			const stat = fs.statSync(path);
			if (stat.isFile() &&
				filterF.test(path)) {
				file.push(path);
			}
			if (stat.isDirectory() &&
				filterD.test(path)) {
				dirs.push(path);
			}
		}
	}
	return file;
};

const entry = (srcdir, extmap, filter) => {
	const host = scan([srcdir], filter);
	const root = [];
	// host paths
	for (const h of host) {
		const {dir:hdir, name, ext}
			= path.parse(h);
		// match host refs
		const refs = fs.readFileSync(h).toString()
			.match(/(?<=\s(src|href)=["'])[^"']+/g) || [];
		// refs paths
		for (const r of refs) {
			const {dir:rdir, name, ext}
				= path.parse(r);
			// infer refs root
			for (const mext of extmap[ext] || []) {
				const r = `${hdir}/${rdir}/${name}.${mext}`;
				if (fs.existsSync(r)) root.push(r);
			}
		}
	}
	return root;
};

const clone = (srcdir, outdir, filterCP, filterRM) => {
	fs.rmSync(outdir, {
		recursive: true,
		force: true,
		filter: filterRM
	});
	fs.cpSync(srcdir, outdir, {
		recursive: true,
		force: true,
		filter: filterCP
	});
};

const loaders = {
	// image
	'.gif':'file',   '.jpg':'file',   '.png':'file',
	'.apng':'file',  '.webp':'file',  '.avif':'file',
	// media
	'.mp3':'file',   '.wav':'file',   '.mp4':'file',
	'.flac':'file',  '.ogg':'file',   '.webm':'file',
	// fonts
	'.ttf':'file',   '.otf':'file',   '.eot':'file',
	'.woff':'file',  '.woff2':'file',
	// markup
	'.html':'text',  '.xml':'text',   '.svg':'text',
};

const imports = {
	'.js': [
		'js',
		'jsx',
		'ts',
		'tsx',
	],
	'.css': [
		'css',
		'scss',
		'sass',
		'less',
	],
};

module.exports = (opts) => {
	const {srcdir, outdir, serve} = opts;
	// cpy filter
	const filter = pathname =>
		new Set(['', ...opts.cpyext])
		.has(path.extname(pathname));
	// get plugins
	const plugins = opts.plugins.map(
		plugname =>
		require(plugname));
	// get entries
	const entries = entry(
		srcdir, imports,
		/[.](html|php)$/);
	// coerce build
	const buildOpts = {
		// project-level
		outbase:     opts.srcdir,
		outdir:      opts.outdir,
		plugins:     plugins,
		loader:      loaders,
		entryPoints: entries,
		// bundle-time
		target:      opts.target,
		bundle:      opts.bundle,
		minify:      opts.minify,
		sourcemap:   opts.sourcemap,
		assetNames:  '-[name]-[hash]',
	};
	// run build
	if (!serve) {
		clone(srcdir, outdir, filter);
		es.build(buildOpts)
		.then(r => {
			const path = `./${outdir}/`;
			console.log(`\n > Build: \x1b[4m${path}\x1b[0m\n`);
		});
	}
	// coerce serve
	const serveOpts = {
		host: `${serve}`
			.replace(/true|^([^:]*):?([^:]*)$/, '$1')
			|| '127.0.0.1',
		port:+`${serve}`
			.replace(/true|^([^:]*):?([^:]*)$/, '$2')
			|| undefined,
		servedir: srcdir,
	};
	// run serve
	if (serve) {
		delete buildOpts.outdir;
		es.serve(serveOpts, buildOpts)
		.then(r => {
			const path = `http://${r.host}:${r.port}/`;
			console.log(`\n > Serve: \x1b[4m${path}\x1b[0m\n`);
		});
	}
};

