# 🥷 esninja

> A faster way to use esbuild

esninja makes using esbuild faster, simpler and cleaner by inferring entry points from `<script>` and `<link>` tags, using sensible asset loader defaults and maintaining separation between source and output files.

Organise your project files freely and cohesively under a single source directory `[--srcdir]`, which is automatically bundled together with npm modules into a single output directory `[--outdir]`. Additional unreferenced assets such as html are accommodated by `[--cpyext]` which selectively copies files between srcdir and outdir based on extension.

The shorthand options `--dev` and `--prod` easily switch between serving with sourcemaps from memory for development; and building with minification into outdir for production without changing any other options.

```
esninja --prod --cpyext .html .jpg

      ./code ────────────────────────────┐
      │                                  │
      ├── index.html                     │
      │      <script src="./index.js">   │
      │      <link  href="./index.css">  │
      │      <img    src="./foo/foo.jpg">│
      │                                  │
      ├── index.ts                       │
      │      import 'bar';               │
      │      import './foo/foo.ts';      │
      │                                  │      ./dist ──────────┐
      ├── index.scss                     │      │                │
      │      @import 'bar';              │      ├── index.html   │
      │      @import './foo/foo.scss';   │      │                │
      │                                  │      ├── index.js     │
      ├── foo                            │      │                │
      │   │                              ├────► ├── index.css    │
      │   ├── foo.jpg                    │      │                │
      │   │                              │      ├── foo/foo.jpg  │
      │   ├── foo.ts                     │      │                │
      │   │                              │      ├── bar-037b.png │
      │   └── foo.scss                   │      │                │
      │                                  │      └────────────────┘
      ./node_modules ────────────────────┤
      │                                  │
      ├── bar                            │
      │   │                              │
      │   ├── bar.png                    │
      │   │                              │
      │   ├── bar.js                     │
      │   │                              │
      │   └── bar.css                    │
      │                                  │
      └──────────────────────────────────┘
```

## Usage

To serve (from srcdir + memory), with implicit developer options use `--dev`, which is a shorthand for `--serve --target=esnext --bundle --sourcemap`, or use explicit options, or custom `--srcdir` e.g:

	esninja --dev

	esninja --dev --srcdir=./mycode

	esninja --serve --bundle --sourcemap

	esninja --serve --bundle --sourcemap --srcdir=./mycode

To build (into outdir), with implicit production options use `--prod`, which is a shorthand for `--target=es2018 --bundle --minify`, or use explicit options, or custom `--srcdir` and `--outdir` e.g:

	esninja --prod

	esninja --prod --srcdir=./mycode --outdir=./mydist

	esninja --bundle --minify

	esninja --bundle --minify --srcdir=./mycode --outdir=./mydist

You can use any combination of options. For instance if you needed to debug minification issues you might want to use the following options:

	esninja --serve --bundle --sourcemap --minify

Similarly if you needed to debug transpilation issues for a particular target environment you might want to use the following options:

	esninja --serve --bundle --sourcemap --target=es2015

## Local Install

You should always do a local install for each repo to ensure everyone (including your future self) is able to remember how to build the project without any assumptions about the environment or their familiarity with this tool.

`npm install esninja`

Edit your package.json:
```
	"scripts": {
		"build": "esninja --prod --srcdir=./code --outdir=./dist",
		"serve": "esninja --dev --srcdir=./code --outdir=./dist"
	}
```

Invoke build via npm:
`npm run build`

Invoke serve via npm:
`npm run serve`

## Global Install

Optionally, it can be useful to perform a one time global install per system to gain interactive access to the cli for testing, experimentation, debugging and to get quick access to the built in manual that includes most of this readme.

`npm install -g esninja`

Read the manual:
`man esninja` or `esninja -h`

Invoke build manually:
`esninja --prod --srcdir=./code --outdir=./dist`

Invoke serve manually:
`esninja --dev --srcdir=./code --outdir=./dist`

## Why & How

esbuild is a brilliantly fast and lean bundler. However it makes few assumptions about projects and their assets, and does not handle unreferenced assets. This increases setup friction, often resulting in build scripts with a tight coupling to project specific requirements, and tends to impose organisational constraints.

esninja reduces these effects by inferring "entry points" from html tags, making sensible "loader" assumptions for referenced assets, and providing a built-in mechanism for copying or serving unreferenced files along side bundled files, which allows project files to be organised freely under a single source directory.

### Implicit entry points

These are the roots of your module trees, they will be bundled into files of the same name containing all of their imports.

Add entry points as `<script>` and `<link>` tags into html file(s) and they will be automatically detected. Preprocessors like `.ts` and `.scss` will be inferred from available files - stick to `.js` and `.css` in the html.

### Referenced assets

These are references to assets from within js and css files using `import`, `require()` and `url()`, e.g `url('foo.png')`, `require('bar.svg')`.

A comprehensive list of binary assets (media, fonts) are configured to use the "file" loader which copies them to the outdir. Unicode assets (`html`, `xml`, `svg`) use the "text" loader which embeds them as a string.

### Unreferenced assets

These are references to assets from within html e.g `<img src=foo.png/>`, or from js when not explicitly imported or required.

These are invisible to esbuild. If they cannot be converted to explicit references, they can be accommodated by extending the `[--cpyext]` option to copy them from the srcdir to outdir, e.g `--cpyext .html .png`.

## Options

### `--serve=[host:port]`
Serve srcdir with in memory bundle.

Equivalent to esbuild's "Approach 1". By serving the `[--srcdir]` along side the in memory bundle it simulates copying arbitrary unreferenced assets to the `[--outdir]` on build. This works despite the srcdir being a mix of html and source, because the in memory files will take precedence.

e.g `--serve=0.0.0.0:3000`

`[host:]`

Uses the loopback interface corresponding to `127.0.0.1` by default, which limits access to the local machine. If you would like to expose the server to the local network use `0.0.0.0`.

e.g `--serve=0.0.0.0`

`[:port]`

Uses the first available open port starting from `8000` by default. Be aware that if you set this manually, you risk conflicting with other processes, so it's best to leave it alone.

e.g `--serve=:3000`

### `--srcdir=<path>`
Set the source directory.

Defaults to `./code`

e.g `--srcdir=./code`

### `--outdir=<path>`
Set the output directory.

Defaults to `./dist`

e.g `--outdir=./dist`

### `--cpyext=<exts...>`
Copy to output directory.

Defaults to `.html`

e.g `--cpyext .html .png`

Used to accommodate "unreferenced assets" which are invisible to the bundler because they are not part of an explicit `import`, `require()` or `url()` statement. Matching files will be copied from the `[--srcdir]` to the `[--outdir]` upon build, with relative directory structures preserved.

At minimum this must include .html to ensure files hosting entry points are copied to the outdir. It should also include any other asset extensions used in html, e.g from `<img/>` tags.

### `--plugins=<plug...>`
Specify npm modules.

Defaults to `./sass`

e.g `--plugins ./sass esbuild-vue`

Used to specify esbuild plugin module paths and names. Currently there is one internal plugin `./sass` included as part of the esninja package. This was included due to lack of full error / warning message integration in existing esbuild sass plugins, and other implementation issues.

To use more esbuild plugins, npm install them and extend this option with the module name. e.g `npm install esbuild-vue`; `esninja --plugins ./sass esbuild-vue --dev`.

### `--target=<targetenv>`
esbuild option - Sets environment.

Target environment for generated js and css code. The target can either be set to a js language version e.g `es2020` or a list of browser versions (currently chrome, firefox, safari, edge and node) e.g `chrome58`.

### `--bundle`
esbuild option - Enable bundling.

It is possible to use esninja/esbuild without this option, i.e by using native esm support in the browser, assuming bundle specific features are not required such as resolving npm modules and bundling assets etc.

### `--minify`
esbuild option - Enable minifying.

Enables minification for .js and .css files. This is usually desirable for production. You can debug minification specific issues by leaving this options enabled and combining it with the `[--sourcemap]` option.

### `--sourcemap`
esbuild option - Generate sourcemaps.

Enables browsers to provide stack traces with original `line:column` numbers and even source code from bundled and minified output. Do not use in production as it provides full access to your original source code.

### `--prod`
Shorthand for `--target=es2018 --bundle --minify`

### `--dev`
Shorthand for `--target=esnext --bundle --sourcemap`
