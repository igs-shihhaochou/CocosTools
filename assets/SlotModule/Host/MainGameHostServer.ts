/**
 * MainGameHost 的「Server 資料解析 / 接收」拆檔。
 *
 * 把 onSetStartGameData / receiveStartGameRequest / setSpinData /
 * receiveSpinRequest / setFeverGameData 五個 method body 拆成
 * module-level function,純粹為了控制單檔行數,不改任何外部 API、@property、
 * scene 序列化、繼承關係。
 *
 * 公開介面 = MainGameHost class 上的 method;這些 helper 由 class wrapper 呼叫。
 */
import {SlotGDK} from '../Define/SlotGDK';
import {
  StartGameExArgs,
  SpinResultExArgs,
  SpecialGameState,
  WheelBlockResultArgs,
  SlotGameDataEx,
  SpecialGameEnterTiming,
} from '../Define/SlotGameData';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {DebugLogSetting} from '../Define/DebugLogSetting';
import {GameStatus, MainGameHost} from './MainGameHost';

export function handleStartGameData(host: MainGameHost): void {
  if (SlotGameDataEx.instance.startGameData === null) {
    if (Define.DEBUG_LOG) {
      console.warn('[MainGameHost] [onSetStartGameData] StartGameData : NULL!');
    }
    return;
  }
  const data = new StartGameExArgs().parse(
    SlotGameDataEx.instance.startGameData
  );
  if (DebugLogSetting.mainGameHost) {
    console.log('[MainGameHost] [onSetStartGameData] StartGameData :', data);
  }
  const resumeBetType =
    SlotGameDataEx.instance.startGameData?.['ResumeBetType'];
  PlatformData.instance.isBonusPlay = resumeBetType === 'BUYBONUS';
  SlotGDK.instance.eventGameStateChanged.notify(data.gameStatusData.sgState);
  applyStartGameRequest(host, data);
}

export function applyStartGameRequest(
  host: MainGameHost,
  Args: StartGameExArgs
): void {
  let isSetAwardProcess = false;
  host.setMainGameProcessQueue();
  if (Args.fakeWheelDataList) {
    host.wheelsManager.setFakeWheelsArrayData(Args.fakeWheelDataList);
  }

  let enterSGTiming: SpecialGameEnterTiming =
    SpecialGameEnterTiming.AfterShowAward;
  if (Args.gameStatusData.sgState !== SpecialGameState.NO_SG) {
    host.hasRecovery = true;
    if (host.specialGameAgent) {
      enterSGTiming = host.specialGameAgent.setRecovery(Args.gameStatusData);
    }
    if (
      host.dontPlayRecoveryAlarmSgId.indexOf(
        Args.gameStatusData.specialGameID
      ) === -1
    ) {
      isSetAwardProcess = true;
    } else {
      host.hasRecovery = true;
      host.setAwardProcessQueue();
      if (SlotGDK.instance.eventIsRecoveryStatus.length > 0) {
        SlotGDK.instance.eventIsRecoveryStatus.notify();
      }
    }
  }

  if (Args.isHaveCoupon) {
    isSetAwardProcess = true;
  }

  if (isSetAwardProcess) {
    const wheelBlockResultArgsList: WheelBlockResultArgs[] = [];
    for (let i = 0, count = Args.fakeWheelDataList.length; i < count; i++) {
      const resultArgs: WheelBlockResultArgs = new WheelBlockResultArgs();
      resultArgs.wheelCtrlIndex = Args.fakeWheelDataList[i].wheelCtrlIndex;
      if (Args.fakeWheelDataList[i].scatterToWheelPosAry !== null) {
        resultArgs.scatterAry = Args.fakeWheelDataList[i].scatterToWheelPosAry;
      }
      wheelBlockResultArgsList.push(resultArgs);
    }

    host.awardController.initCustomized(
      0,
      Args.totalWin,
      0,
      wheelBlockResultArgsList,
      Args.gameStatusData
    );
    host.setAwardProcessQueue();
    if (SlotGDK.instance.eventIsRecoveryStatus.length > 0) {
      SlotGDK.instance.eventIsRecoveryStatus.notify();
    }
  }

  if (!host.isStarted && SlotGDK.instance.receiveStartGame.length > 0) {
    SlotGDK.instance.receiveStartGame.notify(Args);
  }

  if (enterSGTiming === SpecialGameEnterTiming.WheelRotating) {
    host.checkEnterSpecialGame(
      SpecialGameEnterTiming.WheelRotating,
      () => {
        host.setStopProcess(true);
        ///GDK
        if (SlotGDK.instance.eventIsRecoveryStatus.length > 0)
          SlotGDK.instance.eventIsRecoveryStatus.notify();
      },
      null
    );
  }

  host.nextProcess();

  host.isStarted = true;
}

export function handleSpinData(host: MainGameHost, JsonData: JSON): void {
  if (JsonData === null) {
    if (Define.DEBUG_LOG) {
      console.warn('[MainGameHost] [setSpinData] SpinData : NULL!');
    }
    return;
  }
  const data = new SpinResultExArgs().parse(JsonData);
  SlotGDK.instance.eventGameStateChanged.notify(data.gameStatusData.sgState);
  applySpinRequest(host, data);
}

export function applySpinRequest(
  host: MainGameHost,
  ResultArgs: SpinResultExArgs
): void {
  const isListenerDoAllThings = false;
  if (SlotGDK.instance.receiveSpinResultArgs.length > 0) {
    SlotGDK.instance.receiveSpinResultArgs.notify(ResultArgs);
  }
  if (!isListenerDoAllThings) {
    if (host.getNowGameStatus === GameStatus.WaitForSpinRequestCallBack) {
      host.wheelsManager.spinRequestToAllBlock(ResultArgs.wheelResultArgsList);
      if (host.specialGameAgent !== null) {
        host.specialGameAgent.setRequest(ResultArgs.gameStatusData);
      }
      host.awardController.init(ResultArgs);
    } else {
      if (Define.DEBUG_LOG) {
        console.error(
          '[MainGameHost] [receiveSpinRequest] m_NowGameStatus(' +
            GameStatus[host.getNowGameStatus] +
            ') is not WaitForSpinRequestCallBack.'
        );
      }
    }
  }
  host.nextProcess();
}

export function handleFeverGameData(host: MainGameHost, JsonData: JSON): void {
  const sgID = Number(JsonData['sg_id']);
  if (host.specialGameAgent !== null) {
    host.specialGameAgent.processExecutingRemote(sgID, JsonData);
  }
  if (SlotGDK.instance.receiveFeverGameDetail.length > 0) {
    SlotGDK.instance.receiveFeverGameDetail.notify(sgID, JsonData, host);
  }
}
