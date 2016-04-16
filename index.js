'use strict';
const qs = require('querystring');
const path = require('path');

const defined = require('defined');
const xtend = require('xtend');
const warning = require('warning');
const resolve = require('resolve');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ManifestGeneratorPlugin = require('webpack-bbq-manifest-generator');
const libify = require.resolve('webpack-libify');

/**
 * config.basedir
 * config.outputdir
 * config.publicPath
 *
 * client
 * server
 */
const bbq = (config) => (client, server) => {
  warning(
    config.rootdir === undefined,
    'config.rootdir was deprecated, please use config.publicPath instead'
  );
  client = defined(client, {});
  server = defined(server, {});

  // 添加 name
  client.name = defined(client.name, 'client');
  server.name = defined(server.name, 'server');

  const context = config.basedir;

  // configuration - context
  // shared
  // context 必须由 config 指定!
  if (client.context || server.context) {
    throw new Error('context SHOULD NOT BE specified');
  }
  client.context = context;
  server.context = context;

  const getEntry = (id) => {
    const filepath = resolve.sync(id, { basedir: config.basedir })
    const appName = expose(filepath, `${config.basedir}/src/`);
    return { [appName]: filepath };
  }

  // 主文件 (entry)
  // 通过 ${basedir}/src/ 获取主文件，index.js ？是否会有其他的可能？
  // configuration - entry
  // shared
  if (client.entry) {
    if (typeof client.entry === 'string') {
      client.entry = getEntry(client.entry);
    }
  } else {
    client.entry = getEntry(`${config.basedir}/src/`);
  }

  if (server.entry) {
    if (typeof server.entry === 'string') {
      server.entry = getEntry(server.entry);
    }
  } else {
    server.entry = client.entry;
  }

  // 开发环境
  const debug = process.env.NODE_ENV === 'development';

  // configuration - debug
  // shared
  client.debug = defined(client.debug, debug);
  server.debug = defined(server.debug, debug);

  // 文件名需要有 .bundle
  // 文件名在开发环境中没有 chunkhash, contenthash, hash
  // devtool 也不一样
  let filename;
  let cssfilename;
  let bundlename;
  let devtool;
  if (debug) {
    filename = '[name].bundle.js';
    cssfilename = '[name].bundle.css';
    bundlename = '[path][name].[ext]';
    devtool = 'inline-source-map';
  } else {
    filename = '[name]-[chunkhash].bundle.js';
    cssfilename = '[name]-[contenthash].bundle.css';
    bundlename = '[path][name]-[hash].[ext]';
    devtool = 'source-map';
  }

  // configuration - devtool
  // client only
  client.devtool = defined(client.devtool, devtool);

  // plugins
  const plugins = [
    new NamedStats(),
    new ExtractTextPlugin(cssfilename),
    new webpack.optimize.CommonsChunkPlugin({
      filename,
      children: true,
      minChunks: defined(client.minChunks, 3),
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
    new ManifestGeneratorPlugin(`${config.basedir}/app-revisions.json`),
  ];
  if (process.env.NODE_ENV === 'production') {
    plugins.push(new webpack.optimize.DedupePlugin());
    plugins.push(new webpack.optimize.UglifyJsPlugin());
  }

  // configuration - plugins
  // client only
  // 将已有的 plugins 添加到 bbq 设定的后面？
  client.plugins = plugins.concat(client.plugins).filter(v => v);

  const node = { __filename: true, __dirname: true };

  // configuration - node
  // client only
  client.node = xtend(node, client.node);

  // get loaders for specified target
  // supported targets: web, node
  const getLoaders = (target) => {
    const exposeEntryLoaders = Object
    .keys(client.entry)
    .map(name => ({
      test: resolve.sync(client.entry[name], { basedir: config.basedir }),
      loader: `expose-loader?${name}`,
    }));

    const urlLoader = `url-loader?name=${bundlename}`;
    const svgLoader = {
      test: /\.(svg)/,
      loader: `${urlLoader}&limit=10000&mimetype=image/svg_xml`,
    };
    const fontLoader = {
      test: /\.(woff|ttf|woff2|eot)/,
      loader: urlLoader,
    };
    const imagesLoader = {
      test: /\.(png|jpg)$/,
      loader: `${urlLoader}&limit=25000`,
    };

    let babelquery = {
      'presets[]': ['react', 'es2015'],
      'plugins[]': ['transform-object-rest-spread', 'add-module-exports'],
    };
    if (target === 'node') {
      babelquery['plugins[]'].push('transform-ensure-ignore');
    }
    babelquery = qs.stringify(babelquery, null, null, {
      encodeURIComponent: (s) => (s)
    });
    const jsLoader = {
      test: /\.js$/,
      include: `${config.basedir}/src/`,
      loaders: [`babel-loader?${babelquery}`],
    };

    const csslocals =
      'css-loader/locals?modules&localIdentName=[name]__[local]___[hash:base64:5]';
    const externalCssLoader = {
      test: /\.css$/,
      include: /\/node_modules\//,
      loaders: target === 'web' ?
        ExtractTextPlugin.extract('style-loader', 'css-loader').split('!') :
        [csslocals],
    };
    const globalCssRe = /\.global\.css$/
    const globalCssLoader = {
      test: globalCssRe,
      include: `${config.basedir}/src/`,
      loaders: target === 'web' ?
        ExtractTextPlugin.extract('style-loader', ['css-loader', 'postcss-loader']).split('!') :
        [csslocals, 'postcss-loader'],
    };
    const styleLoader = {
      test: /\.css$/,
      include: `${config.basedir}/src/`,
      exclude: (filepath) => globalCssRe.test(path.basename(filepath)),
      loaders: target === 'web' ? [
        'style-loader',
        'css-loader?modules&localIdentName=[name]__[local]___[hash:base64:5]',
        'postcss-loader',
      ] : [
        csslocals,
        'postcss-loader',
      ],
    };

    const jsonLoader = {
      test: /\.json$/,
      loader: 'json-loader',
    };

    const loaders = [
      jsonLoader,
      jsLoader,
      externalCssLoader,
      globalCssLoader,
      styleLoader,
      svgLoader,
      fontLoader,
      imagesLoader,
    ];
    if (target === 'web') {
      return exposeEntryLoaders.concat(loaders);
    }
    return loaders;
  };

  // configuration - module
  // client only
  client.module = xtend(client.module, {
    loaders: getLoaders('web').concat(
      client.module && client.module.loaders
    ).filter(v => v),
  });

  // output
  const output = xtend(client.output, {
    filename,
    chunkFilename: filename,
    path: config.outputdir,
    publicPath: defined(config.publicPath, config.rootdir),
  });

  // configuration - output
  // shared partial
  client.output = output;


  // server land
  
  const postLoaders = [{ loader: libify }];

  // configuration - target
  // server only
  server.target = 'node';

  // configuration - output
  // server only
  server.output = xtend(client.output, {
    path: `${config.outputdir}/SHOULD_NOT_EXISTS_DIRECTORY`,
  });

  // configuration - module
  // server only
  server.module = xtend(server.module, {
    loaders: getLoaders('node').concat(
      server.module && server.module.loaders
    ).filter(v => v),
    postLoaders,
  });

  // configuration - plugins
  server.plugins = [new ShouldNotEmit(), new NamedStats()].concat(server.plugins).filter(v => v);

  return [
    client,
    server,
  ];
};

function ShouldNotEmit() {}
ShouldNotEmit.prototype.apply =
  (compiler) => compiler.plugin('should-emit', () => false);

function NamedStats() {}
NamedStats.prototype.apply = function(compiler) {
  compiler.plugin('done', function(stats) {
    const toString = stats.toString;
    stats.toString = function(options) {
	    const useColors = defined(options.colors, false);
      const bold = (str) => {
        if (useColors) return `\u001b[1m${str}\u001b[22m`;
        else return str;
      };
      const name = this.compilation.options.name;
      return `Compiler Name: ${bold(name)}\n${toString.apply(this, arguments)}`;
    };
  });
};

function expose(filename, basedir) {
  const extname = path.extname(filename);
  const relname = path.relative(basedir, filename);
  return path.join(path.dirname(relname), path.basename(relname, extname));
}

bbq.NamedStats = NamedStats;
bbq.ShouldNotEmit = ShouldNotEmit;
module.exports = bbq;
