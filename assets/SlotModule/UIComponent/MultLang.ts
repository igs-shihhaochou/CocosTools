import {SlotGameDataEx} from '../Define/SlotGameData';

export enum LangType {
  en, //英文
  chs, //簡中
  ms, //馬來
  th, //泰國
  vi, //越南
  id, //印尼
  my, //緬甸
  es, //西班牙
  pt, //葡萄牙,
  it, //義大利
  sv, //瑞典
  ro, //羅馬尼亞\
  gr, //希臘
  fr, //法國
  zh, //繁中 (台灣)
  ja, //日文
  ko, //韓文
  hi, //印地語
  ta, //坦米爾
  bn, //孟加拉
  ur, //烏爾都
  de, //德文
  nl, //荷蘭
  da, //丹麥
  tr, //土耳其
  ru, //俄文
}

export class MultLang {
  public static get nowLangType() {
    return SlotGameDataEx.instance.usingLanguageType;
  }
  public static get nowLangString() {
    return LangType[SlotGameDataEx.instance.usingLanguageType];
  }
}
