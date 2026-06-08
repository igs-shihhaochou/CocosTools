export interface MissingInfo {
    /** Full path like "Canvas/Root/Scripts/Player" */
    nodePath: string;
    /** Node UUID for hierarchy focus */
    nodeUuid: string;
    /** Script missing or asset reference missing */
    missingType: 'script' | 'asset';
    /** The missing UUID or class name */
    detail: string;
    /** Which component on the node */
    componentIndex: number;
}
export interface ScanResult {
    /** "scene" or prefab path */
    source: string;
    totalNodes: number;
    missingCount: number;
    results: MissingInfo[];
    /** Duration in ms */
    duration: number;
}
