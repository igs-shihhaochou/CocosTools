/**
 * MainGameHost 的 BGM 處理。抽出純粹為了控制單檔行數,
 * 不改外部 API、@property、scene 序列化、繼承關係。
 */
import {GamePlayMode} from '../Define/SlotGameData';
import {SlotGameMediator} from '../Define/SlotGameMediator';
import {DebugLogSetting} from '../Define/DebugLogSetting';
import {FadeType} from '../../CommonModule/Script/Manager/AudioTool/AudioMixerStructure';
import {MainGameHost} from './MainGameHost';

/** 播放 / 恢復 MainGame BGM(只在 Normal play mode 下生效)。 */
export function playMainGameBgm(host: MainGameHost): void {
  if (host.getNowPlayMode() !== GamePlayMode.Normal) return;
  if (!host._mainGameBgmAudioId) {
    console.warn('[playMainGameBGM] init');
    host._mainGameBgmAudioId = SlotGameMediator.instance.audioManager.playMusic(
      host.mainGameBGM
    );
  } else {
    if (DebugLogSetting.mainGameHost) {
      console.log('[playMainGameBGM] resume');
    }
    if (host._isFadeOutBgm) {
      host._isFadeOutBgm = false;
      SlotGameMediator.instance.audioManager.fade(
        host._mainGameBgmAudioId,
        FadeType.None
      );
    }
    if (host._isPauseBgm) {
      host._isPauseBgm = false;
      setMainGameBgmResume(host);
    }
  }
  if (host._delaySetBgmVolumeFunction !== null) {
    host.unschedule(host._delaySetBgmVolumeFunction);
    host._delaySetBgmVolumeFunction = null;
  }
}

/** FadeOut BGM。 */
export function fadeOutMainGameBgm(host: MainGameHost): void {
  if (!host._mainGameBgmAudioId) return;
  if (DebugLogSetting.mainGameHost) {
    console.log('[fadeOutMainGameBGM]');
  }
  host._isFadeOutBgm = true;
  SlotGameMediator.instance.audioManager.fadeOut(host._mainGameBgmAudioId);
}

/** 暫停 BGM。 */
export function setMainGameBgmPause(host: MainGameHost): void {
  if (!host._mainGameBgmAudioId) return;
  if (DebugLogSetting.mainGameHost) {
    console.log('[setMainGameBGMPause]');
  }
  host._isPauseBgm = true;
  SlotGameMediator.instance.audioManager.pause(host._mainGameBgmAudioId);
}

/** 重啟 BGM。 */
export function setMainGameBgmResume(host: MainGameHost): void {
  if (!host._mainGameBgmAudioId) return;
  if (DebugLogSetting.mainGameHost) {
    console.log('[setMainGameBGMResume]');
  }
  host._isPauseBgm = false;
  SlotGameMediator.instance.audioManager.resume(host._mainGameBgmAudioId);
}

/** 停止 BGM。 */
export function stopMainGameBgm(host: MainGameHost): void {
  if (!host._mainGameBgmAudioId) return;
  SlotGameMediator.instance.audioManager.stopMusic(host._mainGameBgmAudioId);
  host._mainGameBgmAudioId = undefined;
}
