/**
 * Wheel 的「旋轉 / 換張 / 停輪反彈」核心運算拆檔。
 *
 * 把 Wheel.ts 內 13 個 method body 拆成 module-level function,純粹為了
 * 控制單檔行數,不改任何外部 API、@property、scene 序列化、繼承關係。
 *
 * 公開介面 = Wheel class 上的 method;這些 helper 由 class wrapper 呼叫。
 */
import {Vec2, Vec3, tween} from 'cc';
import {RotateDirection, SymbolInfomation} from '../Define/SlotGameData';
import {
  Define,
  TimeManager,
} from '../../CommonModule/Script/Define/GlobalSetting';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';
import Functions from '../../CommonModule/Script/Utility/Functions';
import {setPosition} from '../../CommonModule/Script/Utility/NodeProperty';
import {Status, Wheel} from './Wheel';

//轉輪旋轉的處理(drop 模式)
export function rotateDropImpl(host: Wheel): void {
  if (host.status === Status.Clearing) {
    host.setClearSymbolPos();
    host.symbolClearing();
    host.status = Status.Rotating;
  } else if (
    host.status === Status.Rotating ||
    host.status === Status.ReadyToStop
  ) {
    // No action needed
  } else if (host.status === Status.Stopping) {
    //收到資料後變成stoping
    if (host.resultQueue.count !== 0 && host.clearFlag === true) {
      const _info: SymbolInfomation = host.resultQueue.dequeue();
      host.passTheSymbol(_info);
    }
    if (host.resultQueue.count === 0) {
      host.status = Status.BreakToBound;
    }
  }
  if (host.status === Status.BreakToBound) {
    host.rotateFlag = false;
    host.drop();
  }
}

//轉輪旋轉的處理(rotate 模式)
export function rotateImpl(host: Wheel): void {
  host.rotateMove();
  if (host.status === Status.Rotating || host.status === Status.ReadyToStop) {
    if (host.checkOverSymbolChangingPos()) {
      host.passTheSymbol();
    }
  } else if (host.status === Status.Stopping) {
    if (host.resultQueue.count !== 0) {
      if (host.checkOverSymbolChangingPos()) {
        const _info: SymbolInfomation = host.resultQueue.dequeue();
        host.passTheSymbol(_info);
      }
    }
    if (host.resultQueue.count === 0) {
      host.status = Status.BreakToBound;
    }
  }
  if (host.status === Status.BreakToBound) {
    host.rotateFlag = false;
    host.breakAndBound();
  }
}

export async function fakeRotateImpl(host: Wheel): Promise<void> {
  host.currentRotationSpeed = host.rotationSpeed;
  host.startFakeRotAll();
  while (
    host.status === Status.Rotating ||
    host.status === Status.ReadyToStop
  ) {
    await waitForSeconds(TimeManager.FixedTimestep);
  }
  while (host.status === Status.Stopping) {
    if (host.resultQueue.count === 0) {
      host.stopFakeRotAll();
      break;
    }
    if (host.rotationSpeed === 0) {
      const _info: SymbolInfomation = host.resultQueue.dequeue();
      host.passTheSymbol(_info);
    } else {
      host.rotateMove();
      if (host.checkOverSymbolChangingPos()) {
        const _info: SymbolInfomation = host.resultQueue.dequeue();
        host.passTheSymbol(_info);
      }
    }
  }
  host.breakAndBound();
}

/// <summary>
/// 轉輪的移動，不使用vector的運算，以便增加效能
/// 2020/8/24 如有傳入參數，則變更轉輪速度
/// </summary>
export function rotateMoveImpl(host: Wheel, customizedSpeed = 0): void {
  if (customizedSpeed === 0) {
    host.currentRotationSpeed = host.rotationSpeed;
  } else {
    host.currentRotationSpeed = customizedSpeed;
  }
  host.thisLocalPosition.x += host.directVector.x * host.currentRotationSpeed;
  host.thisLocalPosition.y += host.directVector.y * host.currentRotationSpeed;
  // 去除浮點數造成的不同時停輪問題
  host.thisLocalPosition.x = Functions.roundDecimalPlaces(
    host.thisLocalPosition.x,
    5
  );
  host.thisLocalPosition.y = Functions.roundDecimalPlaces(
    host.thisLocalPosition.y,
    5
  );
  setPosition(host.node, host.thisLocalPosition);
}

export function startFakeRotAllImpl(host: Wheel): void {
  for (let i = 0; i < host.symbolAry.length; i++) {
    host.symbolAry[i].node.active = false;
  }
  host.fakeRotCtrl.setSingleFakeSpriteStart(host.wheelIndex);
}

export function stopFakeRotAllImpl(host: Wheel): void {
  host.fakeRotCtrl.setSingleFakeSpriteStop(host.wheelIndex);
  for (let i = 0; i < host.symbolAry.length; i++) {
    host.symbolAry[i].node.active = true;
  }
}

/// <summary>
/// 轉輪換張並且迅速位移
/// </summary>
export function passTheSymbolImpl(
  host: Wheel,
  _info: SymbolInfomation = null
): void {
  //假轉時不需要
  if (host.fakeRotCtrl === null) {
    host.thisLocalPosition = new Vec2(
      host.thisLocalPosition.x - host.rotationDistance.x,
      host.thisLocalPosition.y - host.rotationDistance.y
    );
  }
  if (!host.dropFlag) {
    setPosition(host.thisNode, host.thisLocalPosition);
  }
  switch (host.direction) {
    case RotateDirection.Down:
    case RotateDirection.Right:
      for (let i = host.symbolAry.length - 1; i >= 0; i--) {
        if (i !== 0) {
          if (host.symbolAry[i - 1].getActive()) host.symbolAry[i].show();
          else host.symbolAry[i].hide();
          host.symbolAry[i].changeSymbol(host.symbolAry[i - 1].symbolInfo);
        } else {
          if (_info !== null && _info instanceof SymbolInfomation) {
            host.symbolAry[i].changeSymbol(_info);
          } else {
            host.symbolAry[i].changeSymbol(host.getNextFakeSymbol());
          }
        }
      }
      break;
    case RotateDirection.Up:
    case RotateDirection.Left:
      for (let i = 0; i < host.symbolAry.length; i++) {
        if (i !== host.symbolAry.length - 1) {
          if (host.symbolAry[i + 1].getActive()) host.symbolAry[i].show();
          else host.symbolAry[i].hide();
          host.symbolAry[i].changeSymbol(host.symbolAry[i + 1].symbolInfo);
        } else {
          if (_info !== null && _info instanceof SymbolInfomation) {
            host.symbolAry[i].changeSymbol(_info);
          } else {
            host.symbolAry[i].changeSymbol(host.getNextFakeSymbol());
          }
        }
      }
      break;
    default:
      break;
  }
  if (host.eventSymbolChanged.length > 0) {
    host.eventSymbolChanged.notify(host.wheelIndex, host.symbolAry);
  }
}

/// <summary>
/// 確認是否超過換張的判斷點
/// </summary>
export function checkOverSymbolChangingPosImpl(host: Wheel): boolean {
  switch (host.direction) {
    case RotateDirection.Down:
      return host.thisLocalPosition.y < host.symbolChangingPos.y;
    case RotateDirection.Right:
      return host.thisLocalPosition.x > host.symbolChangingPos.x;
    case RotateDirection.Up:
      return host.thisLocalPosition.y > host.symbolChangingPos.y;
    case RotateDirection.Left:
      return host.thisLocalPosition.x > host.symbolChangingPos.x;
    default:
      return false;
  }
}

///停輪時往下多轉一點後彈回來
export function boundImpl(host: Wheel): void {
  //特別閃爍
  const isPlaySpecial = host.playSpeicialShow();
  //聲音
  if (!isPlaySpecial) host.playSoundWhenStop();
  //彈回來 YCMark:Fix
  host.thisLocalPosition = new Vec2(
    host.node.getPosition().x,
    host.node.getPosition().y
  );
  if (!host.dropFlag) {
    tween(host.node)
      .to(host.nowRotateInfo.breakAndBoundTime, {
        position: new Vec3(host.originWheelPos.x, host.originWheelPos.y, 0),
      })
      .call(host.stopped.bind(host))
      .start();
  } else {
    tween(host.node)
      .to(host.nowDropSetting.breakAndBoundTime, {
        position: new Vec3(host.originWheelPos.x, host.originWheelPos.y, 0),
      })
      .call(host.stopped.bind(host))
      .start();
  }
  if (host.eventWheelBreakAndBound.length > 0) {
    host.eventWheelBreakAndBound.notify(host.wheelIndex, host.symbolAry);
  }
}

/// <summary>
/// 停輪時的回彈效果
/// </summary>
export async function breakAndBoundImpl(host: Wheel): Promise<void> {
  if (host.eventBeforeWheelBreakAndBound.length > 0) {
    host.eventBeforeWheelBreakAndBound.notify(host.wheelIndex, host.symbolAry);
  }
  if (!host.dropFlag) {
    for (let i = 0; i < host.nowRotateInfo.breakSneakingTime; i++) {
      host.rotateMove(host.nowRotateInfo.breakSneakingSpeed);
      await waitForSeconds(TimeManager.FixedTimestep);
    }
  } else {
    for (let i = 0; i < host.nowDropSetting.breakSneakingTime; i++) {
      host.rotateMove(host.nowDropSetting.breakSneakingSpeed);
      await waitForSeconds(TimeManager.FixedTimestep);
    }
  }
  //特別閃爍
  const isPlaySpecial = host.playSpeicialShow();
  //聲音
  if (!isPlaySpecial) host.playSoundWhenStop();
  //彈回來 YCMark:Fix
  host.thisLocalPosition = new Vec2(
    host.node.getPosition().x,
    host.node.getPosition().y
  );
  if (!host.dropFlag) {
    tween(host.node)
      .to(host.nowRotateInfo.breakAndBoundTime, {
        position: new Vec3(host.originWheelPos.x, host.originWheelPos.y, 0),
      })
      .call(host.stopped.bind(host))
      .start();
  } else {
    tween(host.node)
      .to(host.nowDropSetting.breakAndBoundTime, {
        position: new Vec3(host.originWheelPos.x, host.originWheelPos.y, 0),
      })
      .call(host.stopped.bind(host))
      .start();
  }
  if (host.eventWheelBreakAndBound.length > 0) {
    host.eventWheelBreakAndBound.notify(host.wheelIndex, host.symbolAry);
  }
}

export function stoppedImpl(host: Wheel): void {
  host.thisLocalPosition = new Vec2(
    host.node.getPosition().x,
    host.node.getPosition().y
  );
  //處理特殊Symbol的閃爍
  host.status = Status.Stop;
  if (host.eventWheelStopped.length > 0) {
    host.eventWheelStopped.notify(host.wheelIndex, host.symbolAry);
  }
}

export function getSymbolRotationTimeImpl(host: Wheel): number {
  let _time = 0;
  if (!host.dropFlag && host.nowRotateInfo !== null) {
    let _distance = 0;
    switch (host.direction) {
      case RotateDirection.Up:
      case RotateDirection.Down:
        _distance = Math.abs(
          host.rotationDistance.y * (host.symbolAry.length - 1)
        );
        break;
      case RotateDirection.Right:
      case RotateDirection.Left:
        _distance = Math.abs(
          host.rotationDistance.x * (host.symbolAry.length - 1)
        );
        break;
    }
    _time =
      (_distance / host.nowRotateInfo.wheelRotateSpeed) *
      TimeManager.FixedTimestep;
  } else if (host.dropFlag && host.nowDropSetting !== null) {
    let _distance = 0;
    switch (host.direction) {
      case RotateDirection.Up:
      case RotateDirection.Down:
        _distance = Math.abs(
          host.rotationDistance.y * (host.symbolAry.length - 1)
        );
        break;
      case RotateDirection.Right:
      case RotateDirection.Left:
        _distance = Math.abs(
          host.rotationDistance.x * (host.symbolAry.length - 1)
        );
        break;
    }
    _time =
      (_distance / host.nowDropSetting.wheelRotateSpeed) *
      TimeManager.FixedTimestep;
  }
  return _time;
}

export function getNextFakeSymbolImpl(host: Wheel): SymbolInfomation {
  if (host.fakeWheelList.length === 0) {
    if (Define.DEBUG_LOG) {
      console.error(
        'Error!! FakeWheelList is Empty in Wheel' + host.wheelIndex + ' !!'
      );
    }
    return null;
  }
  host.fakeWheelCurrentIndex--;
  if (host.fakeWheelCurrentIndex < 0) {
    host.fakeWheelCurrentIndex = host.fakeWheelList.length - 1;
  }
  if (host.fakeWheelCurrentIndex >= host.fakeWheelList.length) {
    host.fakeWheelCurrentIndex = host.fakeWheelList.length - 1;
  }
  return host.fakeWheelList[host.fakeWheelCurrentIndex];
}
