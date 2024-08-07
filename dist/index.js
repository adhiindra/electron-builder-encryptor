"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, "default", { value: mod, enumerable: true })
      : target,
    mod
  )
);
var __toCommonJS = (mod) =>
  __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default,
  defineConfig: () => defineConfig,
  getConfig: () => getConfig,
  run: () => run,
});
module.exports = __toCommonJS(src_exports);
var import_fs2 = __toESM(require("fs"));
var import_path3 = __toESM(require("path"));
var import_asar = __toESM(require("asar"));
var import_adm_zip = __toESM(require("adm-zip"));
var import_yaml = __toESM(require("yaml"));
var import_builder_util = require("builder-util");

// src/encrypt.ts
var import_child_process = require("child_process");
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_crypto = __toESM(require("crypto"));
var import_original_fs = __toESM(require("original-fs"));
async function compileToBytenode(input, output, execPath) {
  const mainDir = import_path.default.dirname(input);
  const compilerFilePath = import_path.default.join(mainDir, "compiler.js");
  input = input.replace(/\\/g, "/");
  output = output.replace(/\\/g, "/");
  const compilerCode = [
    "'use strict';",
    "const bytenode = require('bytenode');",
    "require('v8').setFlagsFromString('--no-lazy');",
    `bytenode.compileFile('${input}', '${output}');`,
    "process.exit();",
  ].join("\n");
  await import_fs.default.promises.writeFile(
    compilerFilePath,
    compilerCode,
    "utf-8"
  );
  (0, import_child_process.execSync)(`${execPath} ${compilerFilePath}`);
  await import_fs.default.promises.unlink(compilerFilePath);
}
function encAes(buf, key = "ft*xx9527") {
  const iv = import_crypto.default.randomBytes(16);
  const cipher = import_crypto.default.createCipheriv(
    "aes-256-cbc",
    md5Salt(key),
    iv
  );
  let encrypted = cipher.update(buf);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}
function readFileMd5(filePath) {
  return new Promise((resolve) => {
    const stream = import_original_fs.default.createReadStream(filePath);
    const hash = import_crypto.default.createHash("md5");
    stream.on("data", (chunk) => {
      hash.update(chunk);
    });
    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });
  });
}
function md5(str) {
  const hash = import_crypto.default.createHash("md5");
  hash.update(str);
  return hash.digest("hex");
}
function md5Salt(key, re = 0) {
  key = key.slice(0, key.length / 6) + key + key.slice(key.length / 4);
  if (key.length <= 128 || (key.length % 2 === 0 && re <= 3)) {
    key = md5Salt(key, ++re);
  }
  const res = Buffer.from(key, "utf8");
  const privateKey = key.length * (955 % 9527) + 996007;
  for (let index = 0; index < res.length; index++) {
    res[index] = res[index] ^ ((privateKey >> 20) & 255);
  }
  const hash = import_crypto.default.createHash("md5");
  hash.update(res);
  return hash.digest("hex");
}
function encryptMd5(str, key = "ft*xx9527") {
  return md5(str + md5Salt(key));
}

// src/config.ts
var import_node_fs = __toESM(require("fs"));
var import_node_path = __toESM(require("path"));
var import_tsup = require("tsup");
var outDir = "node_modules/.electron-builder-encryptor";
async function buildConfig() {
  if (!import_node_fs.default.existsSync(outDir)) {
    import_node_fs.default.promises.mkdir(outDir);
  }
  const configPath = findConfig(["encryptor.config.ts", "encryptor.config.js"]);
  const outConfigPath = import_node_path.default.resolve(
    outDir,
    "encryptor.config.js"
  );
  if (configPath) {
    await (0, import_tsup.build)({
      entry: [configPath],
      outDir,
      platform: "node",
      sourcemap: false,
      dts: false,
      minify: false,
      skipNodeModulesBundle: false,
      silent: true,
      external: [/^[^./]|^\.[^./]|^\.\.[^/]/],
      noExternal: ["electron-builder-encryptor"],
      bundle: true,
      treeshake: true,
      config: false,
    });
    let code = await import_node_fs.default.promises.readFile(
      outConfigPath,
      "utf-8"
    );
    code = treeshakeCode(code);
    await import_node_fs.default.promises.writeFile(
      outConfigPath,
      code,
      "utf-8"
    );
  } else {
    await import_node_fs.default.promises.writeFile(
      outConfigPath,
      '"use strict";module.exports = {};',
      "utf-8"
    );
  }
}
async function mergeConfig(mainJsPath) {
  const preConfigCode = `"use strict";var __encryptorConfig = require('./encryptor.config.js');__encryptorConfig = __encryptorConfig.default || __encryptorConfig;`;
  await import_node_fs.default.promises.writeFile(
    mainJsPath,
    `${preConfigCode}
${await import_node_fs.default.promises.readFile(mainJsPath, "utf-8")}`,
    "utf-8"
  );
  const mainJsDir = import_node_path.default.dirname(mainJsPath);
  await import_node_fs.default.promises.copyFile(
    import_node_path.default.join(outDir, "encryptor.config.js"),
    import_node_path.default.join(mainJsDir, "encryptor.config.js")
  );
}
function findConfig(dirs) {
  for (const dir of dirs) {
    if (import_node_fs.default.existsSync(dir)) {
      return dir;
    }
  }
  return null;
}
function treeshakeCode(code) {
  const newLocal = /\n(__toESM\()?require\(["'].+["']\)(, 1\))?;/gm;
  return code.replace(newLocal, "");
}
function defineConfig(arg) {
  return arg;
}

// src/default-config.ts
function mergeDefaultConfig(arg) {
  const defu = createDefu();
  return defu(arg, {
    key: "ft*xx9527",
    protocol: "myclient",
    privileges: {
      standard: true,
      secure: true,
      bypassCSP: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
    preload: "preload.js",
    renderer: {
      entry: "renderer",
      output: "resources/renderer.pkg",
    },
    syncValidationChanges: false,
  });
}
function isObject(val) {
  return val !== null && typeof val === "object";
}
function _defu(baseObj, defaults, namespace = ".", merger) {
  if (!isObject(defaults)) {
    return _defu(baseObj, {}, namespace, merger);
  }
  const obj = Object.assign({}, defaults);
  for (const key in baseObj) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const val = baseObj[key];
    if (val === null || val === void 0) {
      continue;
    }
    if (merger && merger(obj, key, val, namespace)) {
      continue;
    }
    if (Array.isArray(val) && Array.isArray(obj[key])) {
      obj[key] = val.concat(obj[key]);
    } else if (isObject(val) && isObject(obj[key])) {
      obj[key] = _defu(
        val,
        obj[key],
        (namespace ? `${namespace}.` : "") + key.toString(),
        merger
      );
    } else {
      obj[key] = val;
    }
  }
  return obj;
}
function createDefu() {
  return (...args) => args.reduce((p, c) => _defu(p, c, ""), {});
}

// src/build.ts
var import_path2 = __toESM(require("path"));
var import_tsup2 = require("tsup");
async function buildBundle(entryPath, shuldCleanFiles) {
  entryPath = entryPath.replace(/\\/g, "/");
  const entryDir = import_path2.default.dirname(entryPath);
  const entryName = import_path2.default.basename(entryPath, ".js");
  const bundleName = `${entryName}-bundle`;
  const bundlePath = import_path2.default.join(entryDir, `${bundleName}.js`);
  await (0, import_tsup2.build)({
    entry: {
      [bundleName]: entryPath,
    },
    outDir: entryDir,
    platform: "node",
    sourcemap: false,
    dts: false,
    minify: true,
    skipNodeModulesBundle: true,
    silent: true,
    bundle: true,
    treeshake: true,
    config: false,
    esbuildPlugins: [
      {
        name: "readMetafile",
        setup(build3) {
          build3.onEnd((result) => {
            if (result.metafile) {
              Object.keys(result.metafile.inputs).forEach((key) => {
                if (key !== entryPath) {
                  shuldCleanFiles.add(key);
                }
              });
            }
          });
        },
      },
    ],
  });
  shuldCleanFiles.add(import_path2.default.resolve(bundlePath));
  return bundlePath;
}

// src/index.ts
function src_default(context) {
  return run(context);
}

async function deleteUnpackedDir(dir) {
  import_builder_util.log.info(`DIRECTORY ${dir}`);
  if (import_fs2.default.existsSync(dir)) {
    await import_fs2.default.promises.rm(dir, { recursive: true, force: true });
  }
}

async function run(context, options = {}) {
  const time = Date.now();
  await buildConfig();
  const encryptorConfig = getConfig();
  let appOutDir = context.appOutDir;
  if (context.packager.platform.name === "mac") {
    appOutDir = import_path3.default.join(
      appOutDir,
      `${context.packager.appInfo.productFilename}.app`,
      "Contents"
    );
  }
  const tempAppDir = import_path3.default.join(appOutDir, "../", "app");
  const resourcesDir = import_path3.default.join(appOutDir, "resources");
  const appAsarPath = import_path3.default.join(resourcesDir, "app.asar");
  import_asar.default.extractAll(appAsarPath, tempAppDir);
  const packageJson = JSON.parse(
    await import_fs2.default.promises.readFile(
      import_path3.default.join(tempAppDir, "package.json"),
      "utf8"
    )
  );
  const mainJsPath = import_path3.default.join(tempAppDir, packageJson.main);
  const mainDir = import_path3.default.dirname(mainJsPath);
  import_fs2.default.renameSync(mainJsPath, `${mainJsPath}.tmp`);
  await import_fs2.default.promises.writeFile(
    mainJsPath,
    "require(process.argv[1])",
    "utf-8"
  );
  await import_asar.default.createPackage(tempAppDir, appAsarPath);
  import_fs2.default.renameSync(`${mainJsPath}.tmp`, mainJsPath);
  let execPath = import_path3.default.join(
    appOutDir,
    context.packager.appInfo.productFilename
  );
  if (context.packager.platform.name === "windows") {
    execPath = `${execPath}.exe`;
  }
  const mainJsCPath = import_path3.default.join(mainDir, "main-c.jsc");
  await import_fs2.default.promises.writeFile(
    mainJsPath,
    `${await import_fs2.default.promises.readFile(
      import_path3.default.join(__dirname, "preload.js"),
      "utf-8"
    )}
${await import_fs2.default.promises.readFile(mainJsPath, "utf-8")}`,
    "utf-8"
  );
  await mergeConfig(mainJsPath);
  const cwd = process.cwd();
  const shuldCleanFiles = /* @__PURE__ */ new Set();
  const mainBundlePath = await buildBundle(
    import_path3.default.relative(cwd, mainJsPath),
    shuldCleanFiles
  );
  await compileToBytenode(
    import_path3.default.join(cwd, mainBundlePath),
    mainJsCPath,
    execPath
  );
  await import_fs2.default.promises.writeFile(
    mainJsPath,
    `"use strict";require('bytenode');require('v8').setFlagsFromString('--no-lazy');require('./main-c.jsc');`,
    "utf-8"
  );
  const preloadJsPaths =
    typeof encryptorConfig.preload === "string"
      ? [encryptorConfig.preload]
      : encryptorConfig.preload;
  for (const _preloadJsPath of preloadJsPaths) {
    const preloadJsName = import_path3.default.basename(_preloadJsPath, ".js");
    const rendererPreloadJsPath = import_path3.default.join(
      mainDir,
      _preloadJsPath
    );
    const preloadJsDir = import_path3.default.dirname(rendererPreloadJsPath);
    if (import_fs2.default.existsSync(rendererPreloadJsPath)) {
      const rendererPreloadJsCPath = import_path3.default.join(
        preloadJsDir,
        `${preloadJsName}-c.jsc`
      );
      const preloadBundlePath = await buildBundle(
        import_path3.default.relative(cwd, rendererPreloadJsPath),
        shuldCleanFiles
      );
      await compileToBytenode(
        import_path3.default.join(cwd, preloadBundlePath),
        rendererPreloadJsCPath,
        execPath
      );
      await import_fs2.default.promises.writeFile(
        rendererPreloadJsPath,
        `"use strict";require('bytenode');require('v8').setFlagsFromString('--no-lazy');require('./${preloadJsName}-c.jsc');`,
        "utf-8"
      );
    }
  }
  for (const item of shuldCleanFiles) {
    await import_fs2.default.promises.rm(item, { recursive: true });
  }
  cleanEmptyDir(tempAppDir, [encryptorConfig.renderer.entry, "node_modules"]);
  const rendererDir = import_path3.default.join(
    mainDir,
    encryptorConfig.renderer.entry
  );
  const entryBaseName = import_path3.default.basename(
    encryptorConfig.renderer.entry
  );
  const rendererTempPath = import_path3.default.join(
    mainDir,
    `${entryBaseName}.pkg`
  );
  await buidMainApp(rendererDir, rendererTempPath, encryptorConfig.key);
  if (encryptorConfig.renderer.output) {
    const rendererOutPath = import_path3.default.join(
      appOutDir,
      encryptorConfig.renderer.output
    );
    const rendererOutDir = import_path3.default.dirname(rendererOutPath);
    if (!import_fs2.default.existsSync(rendererOutDir)) {
      await import_fs2.default.promises.mkdir(rendererOutDir, {
        recursive: true,
      });
    }
    await import_fs2.default.promises.rename(rendererTempPath, rendererOutPath);
    const rendererPackageJsonPath = import_path3.default.join(
      rendererDir,
      "package.json"
    );
    if (import_fs2.default.existsSync(rendererPackageJsonPath)) {
      await writeLicense(
        rendererOutPath,
        import_path3.default.resolve(process.cwd(), "package.json"),
        import_path3.default.join(rendererOutDir, `${entryBaseName}.yml`),
        encryptorConfig.key
      );
    }
  }
  // await import_fs2.default.promises.rm(rendererDir, { recursive: true });
  if (options.beforeRePackAsar) {
    await options.beforeRePackAsar({ tempAppDir });
  }
  await import_asar.default.createPackage(tempAppDir, appAsarPath);
  await writeLicense(
    appAsarPath,
    import_path3.default.resolve(process.cwd(), "package.json"),
    import_path3.default.join(resourcesDir, "app.yml"),
    encryptorConfig.key
  );
  await import_fs2.default.promises.rm(tempAppDir, { recursive: true });

  const unpackedDir = import_path3.default.join(
    resourcesDir,
    "app.asar.unpacked"
  );
  await deleteUnpackedDir(unpackedDir);

  import_builder_util.log.info(
    `encrypt success! takes ${Date.now() - time}ms.`
  );
}
function cleanEmptyDir(dir, excludes) {
  let files = import_fs2.default.readdirSync(dir);
  if (excludes) {
    files = files.filter((item) => !excludes.includes(item));
  }
  if (files.length > 0) {
    files.forEach((file) => {
      const fullPath = import_path3.default.join(dir, file);
      if (import_fs2.default.statSync(fullPath).isDirectory()) {
        cleanEmptyDir(fullPath);
        if (import_fs2.default.readdirSync(fullPath).length === 0) {
          import_fs2.default.rmdirSync(fullPath);
        }
      }
    });
  }
}
async function writeLicense(fileDir, packageJsonPath, output, key) {
  const fileMd5 = await readFileMd5(fileDir);
  const asarMd5 = encryptMd5(fileMd5, key);
  const appPackage = await getAppPackage(packageJsonPath);
  const yamlData = {
    name: appPackage.name,
    version: appPackage.version,
    md5: asarMd5,
    file_md5: fileMd5,
  };
  await import_fs2.default.promises.writeFile(
    output,
    import_yaml.default.stringify(yamlData),
    "utf-8"
  );
}
async function buidMainApp(input, output, key) {
  const zip = new import_adm_zip.default();
  zip.addLocalFolder(input);
  let buf = zip.toBuffer();
  buf = encAes(buf, key);
  await import_fs2.default.promises.writeFile(output, buf);
}
async function getAppPackage(jsonPath) {
  const appPackage = await import_fs2.default.promises.readFile(
    jsonPath,
    "utf8"
  );
  return JSON.parse(appPackage);
}
function getConfig() {
  let encryptorConfig = require(import_path3.default.resolve(
    process.cwd(),
    "node_modules/.electron-builder-encryptor/encryptor.config.js"
  ));
  encryptorConfig = encryptorConfig.default || encryptorConfig;
  return mergeDefaultConfig(encryptorConfig);
}
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    defineConfig,
    getConfig,
    run,
  });
