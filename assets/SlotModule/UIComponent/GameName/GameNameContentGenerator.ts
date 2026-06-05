import {
  _decorator,
  CacheMode,
  CCFloat,
  CCInteger,
  CCString,
  Component,
  Node,
  resources,
  RichText,
  UITransform,
  v3,
  type JsonAsset,
  TTFFont,
  CCBoolean,
} from 'cc';
import {GameNameSymbolMapper} from './GameNameSymbolMapper';
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

@ccclass('GameNameContentGenerator')
export class GameNameContentGenerator extends Component {
  @property(Node)
  private contentNode: Node = null;
  @property(CCFloat)
  private contentWidth = 550;
  @property(CCInteger)
  private fontSize = 35;
  @property(GameNameSymbolMapper)
  private symbolMapper: GameNameSymbolMapper = null;
  @property(CCString)
  private folderPath = 'GameName';
  @property(CCString)
  private fileName = 'GameTextDictionary';
  @property(CCString)
  private gameName = 'game-name';
  @property(CCFloat)
  private symbolSizeRatio = 1.25;
  @property(CCBoolean)
  private useSystemFont = false;
  @property(CCBoolean)
  private enableNumberPrefix = true;
  @property(CCFloat)
  private lineHeightRatio = 1.15;
  @property({
    type: TTFFont,
    visible: function (this: GameNameContentGenerator) {
      return !this.useSystemFont;
    },
  })
  private font: TTFFont = null;

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
        const imgHeight =
          this.fontSize *
          this.symbolSizeRatio *
          this.symbolMapper.getCustomScale(key);
        const imgWidth = imgHeight * symbolRatio;
        list.push(
          `<img src="${key}" width=${imgWidth} height=${imgHeight} align=center/>`
        );
      }
    });
    return list;
  }

  private getSymbolHeightRatio(text: string) {
    const symbolList: string[] = getSymbols(text);
    if (symbolList.length === 0) {
      return this.lineHeightRatio;
    }
    let maxRatio = this.lineHeightRatio;
    symbolList.forEach(symbol => {
      const key = symbol.replace('@', '');
      const ratio = this.symbolMapper.getSymbolHeightRatio(key);
      if (ratio > maxRatio) {
        maxRatio = ratio;
      }
    });
    return Math.max(maxRatio, this.lineHeightRatio);
  }

  private generateContent() {
    console.log('[GameNameContentGenerator]', this.translation);
    // generator line container
    const node = new Node(this.gameName);
    node.parent = this.contentNode;
    const trans = node.addComponent(UITransform);
    trans.width = this.contentWidth;
    trans.anchorX = 0;
    node.setPosition(v3(0, 0, 0));
    const text = node.addComponent(RichText);
    text.imageAtlas = this.symbolMapper.spriteAtlas;
    text.verticalAlign = RichText.VerticalAlign.CENTER;
    text.horizontalAlign = RichText.HorizontalAlign.LEFT;
    text.fontSize = this.fontSize;
    text.lineHeight = this.fontSize * this.lineHeightRatio;
    text.cacheMode = CacheMode.BITMAP;
    text.maxWidth = this.contentWidth;
    text.font = this.font;
    text.useSystemFont = this.useSystemFont;
    //get description
    const description = this.translation[this.gameName];
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
    text.string = str;
    //const width = text.node.getComponent(UITransform).width;
    //node.setPosition(v3(-width / 2, 0, 0));
    text.lineHeight = this.fontSize * this.getSymbolHeightRatio(description);
  }

  async start() {
    console.log('[GameNameContentGenerator]', this.symbolMapper.spriteAtlas);
    this.translation = await this.loadJsonFile(
      `${this.folderPath}/${PlatformData.lang.toLocaleLowerCase()}/${this.fileName}`
    );

    this.generateContent();
  }
}
