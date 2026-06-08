import { ScanResult } from './types';
export declare function load(): void;
export declare function unload(): void;
export declare const methods: {
    openPanel(): void;
    /**
     * 掃描當前場景
     * 透過 Editor API 取得當前場景路徑，然後解析 .scene 檔案
     */
    scanCurrentScene(): Promise<ScanResult | null>;
    /**
     * 掃描預製體
     */
    scanPrefab(prefabPath: string): Promise<ScanResult | null>;
    getPendingScan(): {
        type: string;
        target: string;
        version: number;
    };
    getLastResult(): ScanResult | null;
};
