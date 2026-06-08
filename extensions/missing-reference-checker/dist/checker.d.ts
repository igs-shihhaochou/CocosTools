import { ScanResult } from './types';
export declare class MissingChecker {
    private projectPath;
    private validUuids;
    constructor(projectPath: string);
    scanSceneFile(filePath: string): ScanResult;
    scanPrefabFile(filePath: string): ScanResult;
    private analyzeJsonData;
    private findMissingRefs;
    private decompressUuid;
    private buildNodeMap;
    private findOwnerNode;
    private buildNodePath;
    private getComponentIndex;
    private countNodes;
    private collectAllUuids;
    private collectSubMetaUuids;
    private readJsonFile;
    private walkDirectory;
}
