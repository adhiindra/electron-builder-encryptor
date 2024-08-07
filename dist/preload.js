"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));

// src/preload.ts
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var import_mime = __toESM(require("mime"));
var import_electron = require("electron");
var import_yaml = __toESM(require("yaml"));

// src/decrypt.ts
var import_crypto2 = __toESM(require("crypto"));
var import_adm_zip = __toESM(require("adm-zip"));

// src/encrypt.ts
var import_child_process = require("child_process");
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_crypto = __toESM(require("crypto"));
var import_original_fs = __toESM(require("original-fs"));
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
  if (key.length <= 128 || key.length % 2 === 0 && re <= 3) {
    key = md5Salt(key, ++re);
  }
  const res = Buffer.from(key, "utf8");
  const privateKey = key.length * (955 % 9527) + 996007;
  for (let index = 0; index < res.length; index++) {
    res[index] = res[index] ^ privateKey >> 20 & 255;
  }
  const hash = import_crypto.default.createHash("md5");
  hash.update(res);
  return hash.digest("hex");
}
async function readAppAsarMd5(appAsarDir, key = "ft*xx9527") {
  return encryptMd5(await readFileMd5(appAsarDir), key);
}
function encryptMd5(str, key = "ft*xx9527") {
  return md5(str + md5Salt(key));
}
function readAppAsarMd5Sync(appAsarDir, key = "ft*xx9527") {
  return encryptMd5(md5(import_original_fs.default.readFileSync(appAsarDir)), key);
}

// src/decrypt.ts
function decAes(buf, key = "ft*xx9527") {
  const iv = buf.slice(0, 16);
  const encrypted = buf.slice(16);
  const decipher = import_crypto2.default.createDecipheriv("aes-256-cbc", md5Salt(key), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}
function getAppResourcesMap(rendererBuffer, key) {
  const appResourcesMap = /* @__PURE__ */ new Map();
  rendererBuffer = decAes(rendererBuffer, key);
  const _zip = new import_adm_zip.default(rendererBuffer);
  const zipEntries = _zip.getEntries();
  zipEntries.forEach((zip) => {
    if (zip.isDirectory === false) {
      appResourcesMap.set(zip.entryName.toString(), zip.getData());
    }
  });
  return appResourcesMap;
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

// src/preload.ts
var platform = process.platform;
var execDir = import_path2.default.dirname(process.execPath);
if (platform === "darwin") {
  execDir = import_path2.default.join(execDir, "..");
}
__encryptorConfig = mergeDefaultConfig(__encryptorConfig);
if (__encryptorConfig.syncValidationChanges) {
  verifyModifySync();
}
var privileges = __encryptorConfig.privileges;
var appProtocol = __encryptorConfig.protocol;
if (!__encryptorConfig.noRegisterSchemes)
  import_electron.protocol.registerSchemesAsPrivileged([{ scheme: appProtocol, privileges }]);
import_electron.app.whenReady().then(() => {
  wacthClientModify();
  let rendererPath = "";
  if (__encryptorConfig.renderer.output) {
    rendererPath = import_path2.default.join(execDir, __encryptorConfig.renderer.output);
  } else {
    const entryBaseName = import_path2.default.basename(__encryptorConfig.renderer.entry);
    rendererPath = import_path2.default.join(__dirname, `${entryBaseName}.pkg`);
  }
  const appResourcesMap = getAppResourcesMap(import_fs2.default.readFileSync(rendererPath), __encryptorConfig.key);
  import_electron.protocol.registerBufferProtocol(appProtocol, (request, callback) => {
    try {
      let url = request.url.replace(`${appProtocol}://apps/`, "");
      url = url.split(/#|\?/)[0];
      callback({
        data: appResourcesMap.get(url),
        mimeType: import_mime.default.getType(url) || void 0
      });
    } catch (error) {
      console.error(error);
      callback({ data: void 0 });
    }
  });
});
function verifyModifySync() {
  const appAsarDir = import_path2.default.join(execDir, "resources", "app.asar");
  console.time("syncValidationChanges");
  const yamlStr = import_fs2.default.readFileSync(import_path2.default.join(execDir, "resources/app.yml"), "utf-8");
  const verifyMd5 = import_yaml.default.parse(yamlStr).md5;
  const asarMd5 = readAppAsarMd5Sync(appAsarDir, __encryptorConfig.key);
  console.timeEnd("syncValidationChanges");
  if (verifyMd5 !== asarMd5) {
    process.exit();
  }
}
var verifyModify = async (appAsarDir) => {
  const yamlStr = await import_fs2.default.promises.readFile(import_path2.default.join(execDir, "resources/app.yml"), "utf-8");
  const verifyMd5 = import_yaml.default.parse(yamlStr).md5;
  const asarMd5 = await readAppAsarMd5(appAsarDir, __encryptorConfig.key);
  if (verifyMd5 !== asarMd5) {
    const focusedWin = import_electron.BrowserWindow.getFocusedWindow();
    const msg = {
      message: "The program has been tampered with, and the program is about to exit!",
      type: "error"
    };
    if (focusedWin) {
      import_electron.dialog.showMessageBoxSync(focusedWin, msg);
    } else {
      import_electron.dialog.showMessageBoxSync(msg);
    }
    import_electron.app.quit();
  }
};
function wacthClientModify() {
  const appAsarDir = import_path2.default.join(execDir, "resources", "app.asar");
  verifyModify(appAsarDir);
  let fsWait = null;
  import_fs2.default.watch(appAsarDir, (event, filename) => {
    if (filename) {
      if (fsWait)
        return;
      fsWait = setTimeout(() => {
        fsWait = null;
        verifyModify(appAsarDir);
      }, 500);
    }
  });
}
