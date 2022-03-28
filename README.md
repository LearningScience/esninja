# 🥷 esninja

> A faster way to use esbuild

esbuild is a brilliantly fast and lean bundler. However it makes very few assumptions about projects and their assets, does not handle unreferenced assets, and has some rough edges around s/css node_module import compatibility. This increases setup friction, often resulting in build scripts with a tight coupling to project specific requirements and organisational constraints.

esninja makes using esbuild simpler, faster and more complete by mitigating these effects. Usually making a script unnecessary for simple projects...

Entry points are automatically inferred from `<script>` and `<link>` tags, sensible "loader" assumptions are made, s/css node_module name imports are resolved in a more compatible way. A built-in mechanism for copying or serving unreferenced files is provided, allowing project files to be organised freely under a single source directory, maintaining separation between source and output.

## Example

At it's simplest, esninja takes a `--srcdir` and `--outdir`, defaulting to `./code` and `./dist`. Various esbuild options are exposed via the CLI, however the following aliases are more convenient: `--prod` for production, builds into outdir; `--dev` for development, serves from memory. If you have any assets not imported by JS or referenced by CSS urls e.g an `<img>` src, use `--cpyext`, which will copy or serve those files along side the bundle e.g:

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

### Implicit entry points

These are the roots of your module trees, they will be bundled into files of the same name containing all of their imports.

Add entry points as `<script>` and `<link>` tags into html file(s) and they will be automatically detected. Preprocessors like `.ts` and `.scss` will be inferred from available files - stick to `.js` and `.css` in the html.

### Referenced assets

These are references to assets from within js and css files using `import`, `require()` and `url()`, e.g `url('foo.png')`, `require('bar.svg')`.

A comprehensive list of binary assets (media, fonts) are configured to use the "file" loader which copies them to the outdir. Unicode assets (`html`, `xml`, `svg`) use the "text" loader which embeds them as a string.

### Unreferenced assets

These are references to assets from within html e.g `<img src=foo.png/>`, or from js when not explicitly imported or required.

These are invisible to esbuild. If they cannot be converted to explicit references, they can be accommodated by extending the `[--cpyext]` option to copy them from the srcdir to outdir, e.g `--cpyext .html .png`.

### @import for s/css node_modules

By default, esbuild attempts to resolve @import rules against the "main" package.json field for installed node_modules. However many packages contain JavaScript, css and sass all at the same time. To accommodate this, the unofficial "style" (`.css`) and "sass" (`.scss`) fields have emerged, however at the time of writing nether esbuild nor any of the sass plugins supported these unofficial fields.

esninja's built-in `./sass` plugin adds support for these fields when resolving @import statements from both `.scss` and `.css` files. It is also careful to differentiate CSS node_module @imports inside of `.scss` files, which are bundled by esbuild rather than sass. This ensures asset references are correctly resolved relative to the imported file path (which differs from how sass resolves asset paths).

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
