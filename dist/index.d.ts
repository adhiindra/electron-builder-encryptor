import { Privileges } from 'electron';
import { AfterPackContext } from 'electron-builder';

declare type UserConfigExport = UserConfig;
declare interface UserConfig {
    /**
     * encryption key
     */
    key?: string;
    /**
     * renderer protocol scheme
     * @default 'myclient'
     */
    protocol?: string;
    /**
     * electron custom schemes to be registered with options.
     * @default
     * {standard: true, secure: true, bypassCSP: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true, stream: true}
     */
    privileges?: Privileges;
    /**
     * Don't call registerSchemesAsPrivileged
     * @default false
     */
    noRegisterSchemes?: boolean;
    /**
     * preload.js directory, with the program execution directory as the root node
     * @default preload.js
     */
    preload?: string | string[];
    renderer?: {
        /**
         * renderer entry directory, with the program execution directory as the root node
         * @default 'renderer'
         */
        entry: string;
        /**
         * The encrypted storage path of the rendering process, with the program execution directory as the root node
         * @default 'resources/renderer.pkg'
         */
        output: string;
    };
    /**
     * Synchronously detect whether the program has been tampered with when starting the app
     */
    syncValidationChanges?: boolean;
}
declare function defineConfig(arg: UserConfigExport): UserConfig;

declare function export_default(context: AfterPackContext): Promise<void>;
interface BeforeRePackAsarContext {
    tempAppDir: string;
}
interface RunOptions {
    beforeRePackAsar?: (context: BeforeRePackAsarContext) => Promise<void>;
}
/**
 * 在打包成exe之前做点什么
 */
declare function run(context: AfterPackContext, options?: RunOptions): Promise<void>;
declare function getConfig(): Required<UserConfig>;

export { BeforeRePackAsarContext, RunOptions, export_default as default, defineConfig, getConfig, run };
