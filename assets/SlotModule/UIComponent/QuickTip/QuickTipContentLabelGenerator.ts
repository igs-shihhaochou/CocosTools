import {
  _decorator,
  CCFloat,
  CCInteger,
  CCString,
  Component,
  resources,
  RichText,
  UITransform,
  type JsonAsset,
} from 'cc';
import {QuickTipSymbolMapper} from './QuickTipSymbolMapper';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
const {ccclass, property} = _decorator;

const getLines = (descriptions: string) => {
  const words = descriptions.split(' ');
  const lines: string[] = [];
  let tempstr = '';
  // Loop through each word in the descriptions
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // If the word contains '@'
    if (word.includes('@')) {
      // If the temporary string is not empty, push it to the lines array and reset it
      if (tempstr !== '') {
        lines.push(tempstr);
        tempstr = '';
      }
      // Loop through each character in the word
      for (let j = 0; j < word.length; j++) {
        // If the character is '@', push it to the lines array
        if (word[j] === '@') {
          lines.push('@');
        }
      }
    } else {
      // If the word does not contain '@', add it to the temporary string
      tempstr += word + ' ';
      // If it's the last word, push the temporary string to the lines array
      if (i === words.length - 1) {
        lines.push(tempstr);
      }
    }
  }
  return lines;
};

const getSymbols = (text: string) => {
  const matches = text.match(/@[A-Za-z0-9]+/g);
  return matches ? matches : [];
};

@ccclass('QuickTipContentLabelGenerator')
export class QuickTipContentLabelGenerator extends Component {
  @property(CCFloat)
  private maxWidth = 550;
  @property(CCFloat)
  private maxHeight = 300;
  @property(CCInteger)
  private fontSize = 35;
  @property(CCInteger)
  private minFontSize = 12;

  @property(QuickTipSymbolMapper)
  private symbolMapper: QuickTipSymbolMapper = null;
  @property(CCString)
  private folderPath = 'QuickTip';
  @property(CCString)
  private fileName = 'GameTextDictionary';
  @property(CCFloat)
  private symbolSizeRatio = 1.25;
  @property(RichText)
  private richText: RichText = null;
  @property(UITransform)
  private uiTransform: UITransform = null;

  private translation = null;

  private loadJsonFile(path: string) {
    return new Promise(resolve => {
      // Load JSON file from resources
      resources.load<JsonAsset>(path, (err, json) => {
        if (err) {
          console.error(err);
          resolve(null);
        }
        resolve(json.json);
      });
    });
  }

  private getImgList(text: string) {
    const symbolList: string[] = getSymbols(text);
    if (symbolList.length === 0) {
      return [];
    }
    const list = [];
    symbolList.forEach(symbol => {
      const key = symbol.replace('@', '');
      const symbolImgPath = this.symbolMapper.spriteAtlas.getSpriteFrame(key);
      const symbolRatio =
        symbolImgPath.originalSize.width / symbolImgPath.originalSize.height;
      if (symbolImgPath) {
        const imgHeight = this.fontSize * this.symbolSizeRatio;
        const imgWidth = imgHeight * symbolRatio;
        list.push(
          `<img src="${key}" width=${imgWidth} height=${imgHeight} align=center/>`
        );
      }
    });
    return list;
  }

  public setContent(keys: string[]) {
    console.log('[QuickTipContentGenerator]', this.translation);
    this.richText.string = '';
    this.richText.imageAtlas = this.symbolMapper.spriteAtlas;
    //Object.keys(this.translation).forEach((key, index) => {
    keys.forEach(key => {
      //get description
      const description = this.translation[key];
      //get symbol image
      const imgList = this.getImgList(description);
      let count = -1;
      let str = '';
      const lines = getLines(description);
      lines.forEach(line => {
        // Check if the line is a placeholder for an image
        if (line === '@') {
          count++;
          str += `${imgList[count]} `;
        } else {
          str += line;
        }
      });
      this.richText.string += str + '<br/>';
    });

    this.autoFitFontSize();
  }

  autoFitFontSize() {
    this.richText.fontSize = this.fontSize;
    //  this.richText.maxWidth = this.maxWidth;

    this.scheduleOnce(() => {
      let currentFontSize = this.fontSize;
      // 循環調整直到不超出 maxHeight 或到底線為止
      while (
        this.uiTransform.contentSize.height > this.maxHeight &&
        currentFontSize > this.minFontSize
      ) {
        currentFontSize -= 1;
        this.richText.fontSize = currentFontSize;
        this.richText.string += ' '; // 強制更新
      }
    }, 0.1); // 延後一幀執行以確保 RichText 正確排版
  }

  async start() {
    //console.log('[QuickTipContentGenerator]', this.symbolMapper.spriteAtlas);
    this.translation = await this.loadJsonFile(
      `${this.folderPath}/${PlatformData.lang}/${this.fileName}`
    );
  }
}
