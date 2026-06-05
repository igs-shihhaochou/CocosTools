/**
 * DropModule 的「單輪 droping」拆檔。
 *
 * 把 singleWheelDroping / singleWheelDropingAsync 兩個大方法 body
 * 拆成 module-level function,純粹為了控制單檔行數。
 */
import {SlotGameMediator} from '../Define/SlotGameMediator';
import {DropRule, DropSymbolPrefab, SlotGDK} from '../Define/SlotGDK';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';
import NodeEx, {safeTween} from '../../CommonModule/Script/Utility/NodeEx';
import DropModule, {EnumAnimaType, MainGameDropData} from './DropModule';

export async function singleWheelDropingAsyncImpl(
  host: DropModule,
  i: number,
  prewin: boolean,
  dropAry: number[][],
  maskAry: number[][],
  resultWheel: number[][],
  finishCallBack: Function
): Promise<void> {
  const symbolMembers = host.singleDropSymbolMembers.getValue(i);
  let soundFlag = true;
  for (let j = host.displaySymbolNodes[i].length - 1; j >= 0; j--) {
    if (
      symbolMembers[j].showSymbolNode.position.y !==
      symbolMembers[j].originalPosition.y
    ) {
      const nodeEx: NodeEx = new NodeEx(host.displaySymbolNodes[i][j]);
      safeTween(nodeEx)
        .to(
          host.dropInfo.dropTime,
          {y: symbolMembers[j].originalPosition.y},
          {easing: host.dropInfo.wheelEasing}
        )
        .call(() => {
          if (soundFlag) {
            SlotGameMediator.instance.audioManager.play(
              host.wheelStopAudioName
            );
            soundFlag = false;
          }
          if (prewin) {
            const fireAry: number[][] = [];
            for (let m = 0; m < host.displaySymbolNodes.length; m++) {
              fireAry.push([]);
              for (let n = 0; n < host.displaySymbolNodes[i].length; n++) {
                if (m === i && n === j) {
                  fireAry[m].push(1);
                } else {
                  fireAry[m].push(0);
                }
              }
            }
            SlotGDK.event(DropSymbolPrefab.ShowAnimation).notify(
              fireAry,
              maskAry,
              EnumAnimaType.EnumWheelStop,
              i
            );
          }
        })
        .by(host.dropInfo.bounceUpTime, {y: host.dropInfo.bounceHeigh})
        .by(
          host.dropInfo.bounceDownTime,
          {y: -host.dropInfo.bounceHeigh},
          {easing: 'bounceOut'}
        )
        .call(() => {
          SlotGDK.event(DropRule.SingleWheel).notify(resultWheel[i]);
          if (finishCallBack && j === 0) {
            SlotGDK.event(DropSymbolPrefab.EndAnimation).notify(
              dropAry,
              EnumAnimaType.EnumWheelStop,
              i
            );
            if (host.eventDropEnd.length > 0) {
              host.eventDropEnd.notify(i);
            }
            host.singleDropSymbolMembers.changeValueForKey(i, []);
            finishCallBack();
          }
        })
        .start();

      await waitForSeconds(host.dropInfo.symbolGapTime);
    } else {
      const dropTime =
        host.dropInfo.dropTime +
        host.dropInfo.bounceUpTime +
        host.dropInfo.bounceDownTime;
      safeTween(host.displaySymbolNodes[i][j])
        .delay(dropTime)
        .call(() => {
          if (finishCallBack && j === 0) {
            console.log('SymbolDroping Finish CB');
            SlotGDK.event(DropSymbolPrefab.EndAnimation).notify(
              dropAry,
              EnumAnimaType.EnumWheelStop,
              i
            );
            if (host.eventDropEnd.length > 0) {
              host.eventDropEnd.notify(i);
            }
            finishCallBack();
          }
        })
        .start();
    }
  }
}

export async function singleWheelDropingImpl(
  host: DropModule,
  i: number,
  prewin: boolean,
  dropAry: number[][],
  maskAry: number[][],
  finishCallBack: Function
): Promise<void> {
  let soundFlag = false;
  for (let j = host.displaySymbolNodes[i].length - 1; j >= 0; j--) {
    if (
      host.symbolMembers[i][j].showSymbolNode.position.y !==
      host.symbolMembers[i][j].originalPosition.y
    ) {
      const nodeEx: NodeEx = new NodeEx(host.displaySymbolNodes[i][j]);
      safeTween(nodeEx)
        .to(
          host.dropInfo.dropTime,
          {y: host.symbolMembers[i][j].originalPosition.y},
          {easing: host.dropInfo.wheelEasing}
        )
        .call(() => {
          if (soundFlag === false) {
            SlotGameMediator.instance.audioManager.play(
              host.wheelStopAudioName
            );
            soundFlag = true;
          }
          if (prewin) {
            const fireAry: number[][] = [];
            for (let m = 0; m < host.displaySymbolNodes.length; m++) {
              fireAry.push([]);
              for (let n = 0; n < host.displaySymbolNodes[i].length; n++) {
                if (m === i && n === j) {
                  fireAry[m].push(1);
                } else {
                  fireAry[m].push(0);
                }
              }
            }
            SlotGDK.event(DropSymbolPrefab.ShowAnimation).notify(
              fireAry,
              maskAry,
              EnumAnimaType.EnumWheelStop
            );
          }
        })
        .by(host.dropInfo.bounceUpTime, {y: host.dropInfo.bounceHeigh})
        .by(
          host.dropInfo.bounceDownTime,
          {y: -host.dropInfo.bounceHeigh},
          {easing: 'bounceOut'}
        )
        .call(() => {
          host.resultWheel[i][j] = MainGameDropData.instance.resultWheels[i][j];
          SlotGDK.event(DropRule.SingleWheel).notify(i, host.resultWheel[i]);
          if (i >= host.displaySymbolNodes.length - 1 && j === 0) {
            if (finishCallBack) {
              console.log('SymbolDroping Finish CB');
              SlotGDK.event(DropSymbolPrefab.EndAnimation).notify(
                dropAry,
                EnumAnimaType.EnumWheelStop
              );
              if (host.eventDropEnd.length > 0) {
                host.eventDropEnd.notify();
              }
              finishCallBack();
            }
          }
        })
        .start();

      await waitForSeconds(host.dropInfo.symbolGapTime);
    } else {
      const dropTime =
        host.dropInfo.dropTime +
        host.dropInfo.bounceUpTime +
        host.dropInfo.bounceDownTime;
      safeTween(host.displaySymbolNodes[i][j])
        .delay(dropTime)
        .call(() => {
          if (i >= host.displaySymbolNodes.length - 1 && j === 0) {
            if (finishCallBack) {
              console.log('SymbolDroping Finish CB');
              SlotGDK.event(DropSymbolPrefab.EndAnimation).notify(
                dropAry,
                EnumAnimaType.EnumWheelStop
              );
              if (host.eventDropEnd.length > 0) {
                host.eventDropEnd.notify();
              }
              finishCallBack();
            }
          }
        })
        .start();
    }
  }
}
