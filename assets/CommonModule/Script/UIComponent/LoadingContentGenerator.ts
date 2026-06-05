import {
  _decorator,
  CacheMode,
  CCFloat,
  CCInteger,
  CCString,
  Component,
  JsonAsset,
  Label,
  Node,
  resources,
  RichText,
  UITransform,
  v2,
  v3,
  TTFFont,
  CCBoolean,
  Vec3,
  Color,
} from 'cc';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import {LoadingSymbolMapper} from './LoadingSymbolMapper';
import {setPosition} from '../Utility/NodeProperty';
const {ccclass, property} = _decorator;

function getLines(descriptions: string): string[] {
  const words = descriptions.split(' ');
  const lines: string[] = [];
  let temp = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word.includes('@')) {
      if (temp !== '') {
        lines.push(temp);
        temp = '';
      }
      for (const ch of word) {
        if (ch === '@') lines.push('@');
      }
    } else {
      temp += word + ' ';
      if (i === words.length - 1) lines.push(temp);
    }
  }
  return lines;
}

function getSymbols(text: string): string[] {
  return text.match(/@[A-Za-z0-9]+/g) ?? [];
}

@ccclass('LoadingConTentData')
export class LoadingConTentData {
  @property(Node) public pageNode;
  @property(CCString) public translateKey = '';
}

@ccclass('LoadingContentGenerator')
export class LoadingContentGenerator extends Component {
  @property([LoadingConTentData])
  private pageContentData: LoadingConTentData[] = [];
  @property(CCBoolean)
  private dynamicContentWidth = false;
  @property({
    type: CCFloat,
    visible: function (this: LoadingContentGenerator) {
      return this.dynamicContentWidth;
    },
    tooltip: 'CJK字元寬度係數（相對於fontSize）',
  })
  private cjkWidthRatio = 1.0;
  @property({
    type: CCFloat,
    visible: function (this: LoadingContentGenerator) {
      return this.dynamicContentWidth;
    },
    tooltip: '非CJK字元寬度係數（相對於fontSize）',
  })
  private latinWidthRatio = 0.6;
  @property({
    type: CCFloat,
    visible: function (this: LoadingContentGenerator) {
      return this.dynamicContentWidth;
    },
    tooltip: '動態寬度額外padding',
  })
  private contentPadding = 20;
  @property({
    type: CCFloat,
    visible: function (this: LoadingContentGenerator) {
      return !this.dynamicContentWidth;
    },
  })
  private contentWidth = 1000;
  @property(CCInteger)
  private fontSize = 35;
  @property(Vec3)
  private fontPos = v3(0, -230, 0);
  @property(LoadingSymbolMapper)
  private symbolMapper: LoadingSymbolMapper = null;
  @property(CCString)
  private folderPath = 'Loading';
  @property(CCString)
  private fileName = 'GameTextDictionary';
  @property(CCFloat)
  private symbolSizeRatio = 1.25;
  @property(CCBoolean)
  private useSystemFont = false;
  @property({
    type: TTFFont,
    visible: function (this: LoadingContentGenerator) {
      return !this.useSystemFont;
    },
  })
  private font: TTFFont = null;

  // --- Outline ---
  @property(CCBoolean)
  private enableOutline = true;
  @property({
    type: Color,
    visible: function (this: LoadingContentGenerator) {
      return this.enableOutline;
    },
  })
  private outlineColor: Color = new Color(100, 15, 185, 255); // #640FB9
  @property({
    type: CCInteger,
    visible: function (this: LoadingContentGenerator) {
      return this.enableOutline;
    },
  })
  private outlineWidth = 2;

  // --- Shadow ---
  @property(CCBoolean)
  private enableShadow = false;
  @property({
    type: Color,
    visible: function (this: LoadingContentGenerator) {
      return this.enableShadow;
    },
  })
  private shadowColor: Color = new Color(0, 0, 0, 255);
  @property({
    type: CCFloat,
    visible: function (this: LoadingContentGenerator) {
      return this.enableShadow;
    },
  })
  private shadowX = 2;
  @property({
    type: CCFloat,
    visible: function (this: LoadingContentGenerator) {
      return this.enableShadow;
    },
  })
  private shadowY = -2;
  @property({
    type: CCFloat,
    visible: function (this: LoadingContentGenerator) {
      return this.enableShadow;
    },
    tooltip: 'Label 陰影模糊（shadowBlur），預設 2',
  })
  private shadowBlur = 2;

  // --- Bold ---
  @property(CCBoolean)
  private enableBold = false;

  // --- Font Color ---
  @property(Color)
  private fontColor: Color = new Color(255, 255, 255, 255);

  private translation = null;

  private async loadJsonFile(pathNoExt: string): Promise<any> {
    return new Promise<any>(resolve => {
      resources.load(pathNoExt, JsonAsset, (err, asset) => {
        if (err) {
          console.error('[loadJsonFile] load error:', pathNoExt, err);
          resolve(null);
          return;
        }
        resolve(asset?.json ?? null);
      });
    });
  }

  private getImgList(text: string): string[] {
    const symbolList = getSymbols(text);
    if (symbolList.length === 0) return [];

    const list: string[] = [];
    for (const symbol of symbolList) {
      const key = symbol.replace('@', '');
      const frame = this.symbolMapper.spriteAtlas.getSpriteFrame(key);
      if (!frame) continue;
      const ratio = frame.originalSize.width / frame.originalSize.height;
      const imgHeight = this.fontSize * this.symbolSizeRatio;
      const imgWidth = imgHeight * ratio;
      list.push(
        `<img src="${key}" width=${imgWidth} height=${imgHeight} align=center/>`
      );
    }
    return list;
  }

  private calcContentWidth(description: string): number {
    // 去除 RichText tag，只保留純文字
    const plain = description.replace(/<[^>]+>/g, '');
    let width = 0;
    for (const ch of plain) {
      const code = ch.codePointAt(0);
      // CJK Unified Ideographs / CJK symbols / Hiragana / Katakana / Full-width
      const isCJK =
        (code >= 0x4e00 && code <= 0x9fff) ||
        (code >= 0x3000 && code <= 0x30ff) ||
        (code >= 0x3400 && code <= 0x4dbf) ||
        (code >= 0xff00 && code <= 0xffef) ||
        (code >= 0xf900 && code <= 0xfaff);
      width +=
        this.fontSize * (isCJK ? this.cjkWidthRatio : this.latinWidthRatio);
    }
    // 加上圖片寬度
    const symbols = getSymbols(description);
    for (const symbol of symbols) {
      const key = symbol.replace('@', '');
      const frame = this.symbolMapper.spriteAtlas.getSpriteFrame(key);
      if (!frame) continue;
      const ratio = frame.originalSize.width / frame.originalSize.height;
      width += this.fontSize * this.symbolSizeRatio * ratio;
    }
    return width + this.contentPadding;
  }

  private colorToHex(c: Color): string {
    return `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`;
  }

  private wrapRichTextTags(content: string): string {
    let result = content;
    const hex = this.colorToHex(this.fontColor);
    result = `<color=${hex}>${result}</color>`;

    if (this.enableBold) {
      result = `<b>${result}</b>`;
    }
    if (!this.enableShadow && this.enableOutline) {
      const outHex = this.colorToHex(this.outlineColor);
      result = `<outline color=${outHex} width=${this.outlineWidth}>${result}</outline>`;
    }
    return result;
  }

  private applyLabelEffects(label: Label) {
    label.color = this.fontColor;
    label.isBold = !!this.enableBold;

    // Outline
    if (this.enableOutline) {
      label.enableOutline = true;
      label.outlineColor = this.outlineColor;
      label.outlineWidth = this.outlineWidth;
    } else {
      label.enableOutline = false;
    }

    // Shadow
    if (this.enableShadow) {
      label.enableShadow = true;
      label.shadowColor = this.shadowColor;
      label.shadowOffset = v2(this.shadowX, this.shadowY);
      label.shadowBlur = this.shadowBlur;
    } else {
      label.enableShadow = false;
    }
  }

  private applyRichTextChildLabelEffects(richText: RichText) {
    this.scheduleOnce(() => {
      const walk = (n: Node) => {
        for (const child of n.children) {
          const name = child.name ?? '';
          if (name.includes('RICHTEXT_Image_CHILD')) {
            continue;
          }
          if (name.includes('RICHTEXT_CHILD')) {
            const label = child.getComponent(Label);
            if (label) this.applyLabelEffects(label);
          }
          if (child.children?.length) walk(child);
        }
      };
      walk(richText.node);
    }, 0);
  }

  private generateContent() {
    for (let i = 0; i < this.pageContentData.length; i++) {
      const {translateKey, pageNode} = this.pageContentData[i];
      const node = new Node(translateKey);
      node.parent = pageNode;

      const description = this.translation[translateKey];
      const width = this.dynamicContentWidth
        ? this.calcContentWidth(description)
        : this.contentWidth;

      const trans = node.addComponent(UITransform);
      trans.width = width;

      const richText = node.addComponent(RichText);
      richText.imageAtlas = this.symbolMapper.spriteAtlas;
      richText.verticalAlign = RichText.VerticalAlign.CENTER;
      richText.horizontalAlign = RichText.HorizontalAlign.CENTER;
      richText.fontSize = this.fontSize;
      richText.cacheMode = CacheMode.BITMAP;
      richText.maxWidth = width;
      richText.font = this.font;
      richText.useSystemFont = this.useSystemFont;
      setPosition(richText.node, this.fontPos);

      const imgList = this.getImgList(description);
      const lines = getLines(description);

      let str = '';
      let imgIndex = 0;
      for (const line of lines) {
        if (line === '@') {
          str += `${imgList[imgIndex++]} `;
        } else {
          str += line;
        }
      }

      // 如有勾選陰影，則改成針對 RICHTEXT_CHILD 的 Label 套用內建陰影/外框/模糊等效果
      // 避免使用 <b>/<outline> tag（會與子節點 Label 效果重疊或不一致）
      richText.string = this.wrapRichTextTags(str);
      if (this.enableShadow) {
        this.applyRichTextChildLabelEffects(richText);
      }
    }
  }

  async start() {
    let path = `${this.folderPath}/${PlatformData.lang}/${this.fileName}`;
    this.translation = await this.loadJsonFile(path);

    if (!this.translation) {
      console.warn('[LoadingContentGenerator] JSON is null, fallback to en-us');
      path = `${this.folderPath}/en-us/${this.fileName}`;
      this.translation = await this.loadJsonFile(path);
    }

    this.generateContent();
  }
}
