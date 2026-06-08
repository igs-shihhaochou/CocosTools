/**
 * Scene Script — 在場景環境中執行，可存取 cc 模組
 * 透過 Editor.Message.request('scene', 'execute-scene-script', ...) 呼叫
 */
/**
 * 掃描當前場景中的所有節點，檢查是否有 Missing Script 或 Missing Asset
 */
export declare function scanScene(): {
    results: any[];
    totalNodes: number;
};
