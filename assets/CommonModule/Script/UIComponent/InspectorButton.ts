// import {_decorator, Component, CCInteger, EventHandler} from 'cc';
// const {ccclass, property, inspector, executeInEditMode} = _decorator;

// @ccclass('InspectorButton')
// @executeInEditMode
// @inspector('packages://inspector-button/button.js')
// export default class InspectorButton extends Component {
//   @property([EventHandler])
//   public events: EventHandler[] = [];
//   @property(CCInteger)
//   public index = 0;
//   public InspectorButtonFunction(): string {
//     if (this.index < this.events.length && this.index >= 0) {
//       if (this.events[this.index].customEventData) {
//         this.events[this.index].emit([this.events[this.index].customEventData]);
//       } else {
//         this.events[this.index].emit(null);
//       }
//       return 'Emit Event Success';
//     } else {
//       return 'Index Out of Range';
//     }
//   }
// }
