import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TestEnable')
export class TestEnable extends Component {
    protected onEnable(): void {
        console.error('!!!!!!!!!!!!TestEnable onEnable');
    }

    protected onDisable(): void {
        console.error('!!!!!!!!!!!!TestEnable onDisable');
    }

    protected onDestroy(): void {
        console.error('!!!!!!!!!!!!TestEnable onDestroy');
    }
}

