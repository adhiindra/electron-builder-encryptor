var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw new Error('Dynamic require of "' + x + '" is not supported');
});

// src/index.ts
import fs3 from "fs";
import path4 from "path";
import asar from "asar";
import AdmZip from "adm-zip";
import YAML from "yaml";
import { log } from "builder-util";

// src/encrypt.ts
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import originalFs from "original-fs";
async function compileToBytenode(input, output, execPath) {
  const mainDir = path.dirname(input);
  const compilerFilePath = path.join(mainDir, "compiler.js");
  input = input.replace(/\\/g, "/");
  output = output.replace(/\\/g, "/");
  const compilerCode = [
    "'use strict';",
    "const bytenode = require('bytenode');",
    "require('v8').setFlagsFromString('--no-lazy');",
    `bytenode.compileFile('${input}', '${output}');`,
    "process.exit();"
  ].join("\n");
  await fs.promises.writeFile(compilerFilePath, compilerCode, "utf-8");
  execSync(`${execPath} ${compilerFilePath}`);
  await fs.promises.unlink(compilerFilePath);
}
function encAes(buf, key = "ft*xx9527") {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", md5Salt(key), iv);
  let encrypted = cipher.update(buf);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}
function readFileMd5(filePath) {
  return new Promise((resolve) => {
    const stream = originalFs.createReadStream(filePath);
    const hash = crypto.createHash("md5");
    stream.on("data", (chunk) => {
      hash.update(chunk);
    });
    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });
  });
}
function md5(str) {
  const hash = crypto.createHash("md5");
  hash.update(str);
  return hash.digest("hex");
}
function md5Salt(key, re = 0) {
  key = key.slice(0, key.length / 6) + key + key.slice(key.length / 4);
  if (key.length <= 128 || key.length % 2 === 0 && re <= 3) {
    key = md5Salt(key, ++re);
  }
  const res = Buffer.from(key, "utf8");
  const privateKey = key.length * (955 % 9527) + 996007;
  for (let index = 0; index < res.length; index++) {
    res[index] = res[index] ^ privateKey >> 20 & 255;
  }
  const hash = crypto.createHash("md5");
  hash.update(res);
  return hash.digest("hex");
}
function encryptMd5(str, key = "ft*xx9527") {
  return md5(str + md5Salt(key));
}

// src/config.ts
import fs2 from "node:fs";
import path2 from "node:path";
import { build } from "tsup";
var outDir = "node_modules/.electron-builder-encryptor";
async function buildConfig() {
  if (!fs2.existsSync(outDir)) {
    fs2.promises.mkdir(outDir);
  }
  const configPath = findConfig(["encryptor.config.ts", "encryptor.config.js"]);
  const outConfigPath = path2.resolve(outDir, "encryptor.config.js");
  if (configPath) {
    await build({
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
      config: false
    });
    let code = await fs2.promises.readFile(outConfigPath, "utf-8");
    code = treeshakeCode(code);
    await fs2.promises.writeFile(outConfigPath, code, "utf-8");
  } else {
    await fs2.promises.writeFile(outConfigPath, '"use strict";module.exports = {};', "utf-8");
  }
}
async function mergeConfig(mainJsPath) {
  const preConfigCode = `"use strict";var __encryptorConfig = require('./encryptor.config.js');__encryptorConfig = __encryptorConfig.default || __encryptorConfig;`;
  await fs2.promises.writeFile(mainJsPath, `${preConfigCode}
${await fs2.promises.readFile(mainJsPath, "utf-8")}`, "utf-8");
  const mainJsDir = path2.dirname(mainJsPath);
  await fs2.promises.copyFile(path2.join(outDir, "encryptor.config.js"), path2.join(mainJsDir, "encryptor.config.js"));
}
function findConfig(dirs) {
  for (const dir of dirs) {
    if (fs2.existsSync(dir)) {
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
      stream: true
    },
    preload: "preload.js",
    renderer: {
      entry: "renderer",
      output: "resources/renderer.pkg"
    },
    syncValidationChanges: false
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
      obj[key] = _defu(val, obj[key], (namespace ? `${namespace}.` : "") + key.toString(), merger);
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
import path3 from "path";
import { build as build2 } from "tsup";
async function buildBundle(entryPath, shuldCleanFiles) {
  entryPath = entryPath.replace(/\\/g, "/");
  const entryDir = path3.dirname(entryPath);
  const entryName = path3.basename(entryPath, ".js");
  const bundleName = `${entryName}-bundle`;
  const bundlePath = path3.join(entryDir, `${bundleName}.js`);
  await build2({
    entry: {
      [bundleName]: entryPath
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
        }
      }
    ]
  });
  shuldCleanFiles.add(path3.resolve(bundlePath));
  return bundlePath;
}

// src/index.ts
function src_default(context) {
  return run(context);
}
async function run(context, options = {}) {
  const time = Date.now();
  await buildConfig();
  const encryptorConfig = getConfig();
  let appOutDir = context.appOutDir;
  if (context.packager.platform.name === "mac") {
    appOutDir = path4.join(appOutDir, `${context.packager.appInfo.productFilename}.app`, "Contents");
  }
  const tempAppDir = path4.join(appOutDir, "../", "app");
  const resourcesDir = path4.join(appOutDir, "resources");
  const appAsarPath = path4.join(resourcesDir, "app.asar");
  asar.extractAll(appAsarPath, tempAppDir);
  const packageJson = JSON.parse(await fs3.promises.readFile(path4.join(tempAppDir, "package.json"), "utf8"));
  const mainJsPath = path4.join(tempAppDir, packageJson.main);
  const mainDir = path4.dirname(mainJsPath);
  fs3.renameSync(mainJsPath, `${mainJsPath}.tmp`);
  await fs3.promises.writeFile(mainJsPath, "require(process.argv[1])", "utf-8");
  await asar.createPackage(tempAppDir, appAsarPath);
  fs3.renameSync(`${mainJsPath}.tmp`, mainJsPath);
  let execPath = path4.join(appOutDir, context.packager.appInfo.productFilename);
  if (context.packager.platform.name === "windows") {
    execPath = `${execPath}.exe`;
  }
  const mainJsCPath = path4.join(mainDir, "main-c.jsc");
  await fs3.promises.writeFile(mainJsPath, `${await fs3.promises.readFile(path4.join(__dirname, "preload.js"), "utf-8")}
${await fs3.promises.readFile(mainJsPath, "utf-8")}`, "utf-8");
  await mergeConfig(mainJsPath);
  const cwd = process.cwd();
  const shuldCleanFiles = /* @__PURE__ */ new Set();
  const mainBundlePath = await buildBundle(path4.relative(cwd, mainJsPath), shuldCleanFiles);
  await compileToBytenode(path4.join(cwd, mainBundlePath), mainJsCPath, execPath);
  await fs3.promises.writeFile(mainJsPath, `"use strict";require('bytenode');require('v8').setFlagsFromString('--no-lazy');require('./main-c.jsc');`, "utf-8");
  const preloadJsPaths = typeof encryptorConfig.preload === "string" ? [encryptorConfig.preload] : encryptorConfig.preload;
  for (const _preloadJsPath of preloadJsPaths) {
    const preloadJsName = path4.basename(_preloadJsPath, ".js");
    const rendererPreloadJsPath = path4.join(mainDir, _preloadJsPath);
    const preloadJsDir = path4.dirname(rendererPreloadJsPath);
    if (fs3.existsSync(rendererPreloadJsPath)) {
      const rendererPreloadJsCPath = path4.join(preloadJsDir, `${preloadJsName}-c.jsc`);
      const preloadBundlePath = await buildBundle(path4.relative(cwd, rendererPreloadJsPath), shuldCleanFiles);
      await compileToBytenode(path4.join(cwd, preloadBundlePath), rendererPreloadJsCPath, execPath);
      await fs3.promises.writeFile(rendererPreloadJsPath, `"use strict";require('bytenode');require('v8').setFlagsFromString('--no-lazy');require('./${preloadJsName}-c.jsc');`, "utf-8");
    }
  }
  for (const item of shuldCleanFiles) {
    await fs3.promises.rm(item, { recursive: true });
  }
  cleanEmptyDir(tempAppDir, [encryptorConfig.renderer.entry, "node_modules"]);
  const rendererDir = path4.join(mainDir, encryptorConfig.renderer.entry);
  const entryBaseName = path4.basename(encryptorConfig.renderer.entry);
  const rendererTempPath = path4.join(mainDir, `${entryBaseName}.pkg`);
  await buidMainApp(rendererDir, rendererTempPath, encryptorConfig.key);
  if (encryptorConfig.renderer.output) {
    const rendererOutPath = path4.join(appOutDir, encryptorConfig.renderer.output);
    const rendererOutDir = path4.dirname(rendererOutPath);
    if (!fs3.existsSync(rendererOutDir)) {
      await fs3.promises.mkdir(rendererOutDir, { recursive: true });
    }
    await fs3.promises.rename(rendererTempPath, rendererOutPath);
    const rendererPackageJsonPath = path4.join(rendererDir, "package.json");
    if (fs3.existsSync(rendererPackageJsonPath)) {
      await writeLicense(rendererOutPath, path4.resolve(process.cwd(), "package.json"), path4.join(rendererOutDir, `${entryBaseName}.yml`), encryptorConfig.key);
    }
  }
  await fs3.promises.rm(rendererDir, { recursive: true });
  if (options.beforeRePackAsar) {
    await options.beforeRePackAsar({ tempAppDir });
  }
  await asar.createPackage(tempAppDir, appAsarPath);
  await writeLicense(appAsarPath, path4.resolve(process.cwd(), "package.json"), path4.join(resourcesDir, "app.yml"), encryptorConfig.key);
  await fs3.promises.rm(tempAppDir, { recursive: true });
  log.info(`encrypt success! takes ${Date.now() - time}ms.`);
}
function cleanEmptyDir(dir, excludes) {
  let files = fs3.readdirSync(dir);
  if (excludes) {
    files = files.filter((item) => !excludes.includes(item));
  }
  if (files.length > 0) {
    files.forEach((file) => {
      const fullPath = path4.join(dir, file);
      if (fs3.statSync(fullPath).isDirectory()) {
        cleanEmptyDir(fullPath);
        if (fs3.readdirSync(fullPath).length === 0) {
          fs3.rmdirSync(fullPath);
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
    file_md5: fileMd5
  };
  await fs3.promises.writeFile(output, YAML.stringify(yamlData), "utf-8");
}
async function buidMainApp(input, output, key) {
  const zip = new AdmZip();
  zip.addLocalFolder(input);
  let buf = zip.toBuffer();
  buf = encAes(buf, key);
  await fs3.promises.writeFile(output, buf);
}
async function getAppPackage(jsonPath) {
  const appPackage = await fs3.promises.readFile(jsonPath, "utf8");
  return JSON.parse(appPackage);
}
function getConfig() {
  let encryptorConfig = __require(path4.resolve(process.cwd(), "node_modules/.electron-builder-encryptor/encryptor.config.js"));
  encryptorConfig = encryptorConfig.default || encryptorConfig;
  return mergeDefaultConfig(encryptorConfig);
}
export {
  src_default as default,
  defineConfig,
  getConfig,
  run
};
