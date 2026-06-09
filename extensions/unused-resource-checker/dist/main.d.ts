import { ScanResult } from './scanner';
export declare function load(): void;
export declare function unload(): void;
export declare const methods: {
    openPanel(): void;
    scanFolderByUrl(folderUrl: string): void;
    getPendingScanFolder(): {
        folder: string;
        version: number;
    };
    scanForPanel(options?: {
        scanFolder?: string;
    }): Promise<ScanResult | null>;
    deleteAssets(dbUrls: string[]): Promise<{
        success: number;
        failed: number;
    }>;
};
