/**
 * Cocos Creator Editor 全域型別宣告（簡化版）
 * 在 Cocos Creator 編輯器環境中，Editor 為全域物件
 */
declare namespace Editor {
    namespace Panel {
        function open(panelId: string): void;
        function define(options: any): any;
    }

    namespace Project {
        const path: string;
    }

    namespace Message {
        function request(extensionName: string, method: string, ...args: any[]): Promise<any>;
        function send(extensionName: string, method: string, ...args: any[]): void;
    }

    namespace Utils {
        namespace Path {
            function join(...paths: string[]): string;
        }
    }
}
