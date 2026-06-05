import {_decorator, Node, Component, CCString} from 'cc';

const {ccclass, property} = _decorator;

@ccclass('EventFormat')
export class EventFormat {
  @property(CCString)
  public key = '';
  @property(Node)
  public target: Node | null = null;
  @property(CCString)
  public className = '';
  @property(CCString)
  public functionName = '';
}

/**
 * 代替事件呼叫(主要解決AnimationEvent只能呼叫物件本身掛載腳本的Function問題)
 */
@ccclass('EventCaller')
export class EventCaller extends Component {
  @property([EventFormat])
  private event: EventFormat[] = [];

  public onDestroy() {
    this.event = null;
  }

  public callEvent(key: string) {
    for (let i = 0; i < this.event.length; i++) {
      if (this.event[i].key === key) {
        const target = this.event[i].target.getComponent(
          this.event[i].className
        );

        if (target) {
          if (target[this.event[i].functionName]) {
            target[this.event[i].functionName]();
          } else {
            console.warn(
              'EventCaller Not Found Target : ' + this.event[i].className
            );
          }
        } else {
          console.warn(
            'EventCaller Not Found Function : ' + this.event[i].functionName
          );
        }

        return;
      }
    }
  }
}
