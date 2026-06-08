/**
 * Cocos Creator Editor 全域型別宣告
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

    namespace Dialog {
        function info(title: string, options?: { detail?: string; buttons?: string[] }): Promise<{ response: number }>;
        function warn(title: string, options?: { detail?: string; buttons?: string[] }): Promise<{ response: number }>;
    }

    namespace Utils {
        namespace Path {
            function join(...paths: string[]): string;
        }
    }
}
