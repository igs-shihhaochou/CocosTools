import {
  _decorator,
  Component,
  Node,
  Vec3,
  Color,
  Enum,
  game,
  director,
  Director,
  Camera,
  v3,
  color,
  UIOpacity,
} from 'cc';
import {
  getColor,
  getNodeSpaceAR,
  getWorldSpaceAR,
  getOpacity,
  setColor,
  setOpacity,
} from '../Utility/NodeProperty';
import {nodeEx} from '../Utility/NodeEx';
const {ccclass, property, menu} = _decorator;

/** 更新模式 */
export enum enumUpdateMode {
  /** 常態更新 */
  ALWAYS,
  /** 視窗尺寸變更 */
  WINDOW_RESIZE,
}

/**
 * 提供給不在同節點下，但需要同步Node屬性的節點，如按鈕內的動態文字
 * 同步對象節點設定至當前節點設定
 * 當前節點須為靜態節點
 */
@ccclass('SyncNodeProperty')
@menu('CommonModule/UIComponent/SyncNodeProperty')
export default class SyncNodeProperty extends Component {
  /** 同步Node對象 (載入前設定才有效) */
  @property(Node)
  public syncNode: Node = null;
  /** 更新模式 (載入前設定才有效) */
  @property({type: Enum(enumUpdateMode)})
  public updateMode: enumUpdateMode = enumUpdateMode.ALWAYS;
  /** 是否同步節點位置座標 */
  @property({
    visible: function (this: SyncNodeProperty) {
      return this.isSync3DNode === false;
    },
  })
  public isSyncPosition = false;
  /** 是否透過世界座標同步節點位置座標 */
  @property({
    visible: function (this: SyncNodeProperty) {
      return this.isSync3DNode === false;
    },
  })
  public isSyncPositionByWorld = false;
  /** 是否完全同步世界座標位置 (直接設置為同步節點的世界座標) */
  @property({
    visible: function (this: SyncNodeProperty) {
      return this.isSync3DNode === false;
    },
  })
  public isSyncPositionByWorldExact = false;
  /** 是否同步節點旋轉角度 */
  @property
  public isSyncRotation = false;
  /** 是否同步節點縮放大小 */
  @property
  public isSyncScale = false;
  /** 是否同步節點顏色數值 */
  @property({
    visible: function (this: SyncNodeProperty) {
      return this.isSync3DNode === false;
    },
  })
  public isSyncColor = false;
  /** 是否同步節點不透明度 */
  @property({
    visible: function (this: SyncNodeProperty) {
      return this.isSync3DNode === false;
    },
  })
  public isSyncOpacity = false;
  /** 是否同步3D節點，是的話一定要設定3D相機 */
  @property
  public isSync3DNode = false;
  /** 3D節點的相機 */
  @property({
    type: Camera,
    visible: function (this: SyncNodeProperty) {
      return this.isSync3DNode === true;
    },
  })
  public sync3DCamera: Camera = null;
  //#endregion

  /** 初始當前組件節點設定 (Clone) */
  private initCurrentNode: Node = null;
  /** 初始同步對象節點設定 (Clone) */
  private initSyncNode: Node = null;

  /** 初始同步對象節點世界座標 */
  private initSyncWorldPosition: Vec3 = null;
  /** 初始同步3D對象節點UI座標 */
  private initSync3DUIPosition: Vec3 = null;
  /** 初始當前組件節點世界座標 */
  private initCurrentWorldPosition: Vec3 = null;
  /** 初始世界座標偏移量 */
  private initWorldPositionOffset: Vec3 = null;

  /** 註冊視窗調整Function (註冊與取消註冊對象須相同) */
  private bindResizeHandler: EventListenerObject = null;

  /** 用來暫存同步節點的歐拉角差值 */
  private deltaSyncEuler: Vec3 = new Vec3();

  protected override onLoad() {
    // 如果有設置同步節點 則進行初始化
    if (this.syncNode !== null && this.initSyncNode === null)
      this.setSyncNode(this.syncNode);

    // 如果有設置更新模式 則進行初始化
    if (this.updateMode !== null) {
      // 使用臨時變數保存更新模式 然後設置為null後再調用SetUpdateMode
      // 這樣可以避免SetUpdateMode中的檢查問題
      const tempMode: enumUpdateMode = this.updateMode;
      this.updateMode = null;
      this.setUpdateMode(tempMode);
    }
  }

  protected override onDestroy() {
    // 清除初始狀態
    this.clearSyncNodeInitInfo();
    // 清除視窗調整事件監聽器
    this.clearBindResizeHandler();

    this.syncNode = null;
  }

  protected override update() {
    if (this.syncNode === null || this.updateMode !== enumUpdateMode.ALWAYS)
      return;

    this.updateSyncNode();
  }

  /**
   * 從外部創建SyncNodeProperty實例並初始化
   * 適用於動態創建而非通過editor的情況
   * @param node 要新增組件的節點
   * @param syncNode 同步目標節點
   * @param syncParam 同步屬性配置
   * @returns 創建的SyncNodeProperty實例
   */
  public static createAndInit(
    node: Node,
    syncNode: Node,
    syncParam: SyncNodePropertyParam
  ): SyncNodeProperty {
    if (!node || !syncNode) {
      console.error('[SyncNodeProperty] CreateAndInit: Node cannot be empty');
      return null;
    }

    // 新增SyncNodeProperty組件
    const syncNodeProperty: SyncNodeProperty =
      node.addComponent(SyncNodeProperty);
    syncNodeProperty.updateMode = syncParam.updateMode ?? enumUpdateMode.ALWAYS;
    syncNodeProperty.isSyncPosition = syncParam.isSyncPosition ?? false;
    syncNodeProperty.isSyncPositionByWorld =
      syncParam.isSyncPositionByWorld ?? false;
    syncNodeProperty.isSyncPositionByWorldExact =
      syncParam.isSyncPositionByWorldExact ?? false;
    syncNodeProperty.isSyncRotation = syncParam.isSyncRotation ?? false;
    syncNodeProperty.isSyncScale = syncParam.isSyncScale ?? false;
    syncNodeProperty.isSyncColor = syncParam.isSyncColor ?? false;
    syncNodeProperty.isSyncOpacity = syncParam.isSyncOpacity ?? false;
    syncNodeProperty.isSync3DNode = syncParam.isSync3DNode ?? false;
    syncNodeProperty.sync3DCamera = syncParam.sync3DCamera ?? null;

    // 設置同步節點
    syncNodeProperty.setSyncNode(syncNode);
    // 設置更新模式
    syncNodeProperty.setUpdateMode(syncNodeProperty.updateMode);

    return syncNodeProperty;
  }

  /**
   * 設定同步的目標節點
   * @param targetNode
   */
  public setSyncNode(targetNode: Node) {
    this.syncNode = targetNode;

    // 清除初始狀態
    this.clearSyncNodeInitInfo();

    if (this.syncNode === null) return;

    // 建立輕量級節點存儲初始狀態 而非cc.instantiate
    this.initCurrentNode = new Node();
    this.initSyncNode = new Node();

    this.copyNodeProperty(this.node, this.initCurrentNode);
    this.copyNodeProperty(this.syncNode, this.initSyncNode);

    this.initSyncWorldPosition = getWorldSpaceAR(this.syncNode).clone();
    this.initCurrentWorldPosition = getWorldSpaceAR(this.node);
    this.initWorldPositionOffset = this.initCurrentWorldPosition.subtract(
      this.initSyncWorldPosition
    );

    // 首次同步節點屬性
    this.updateSyncNode();
  }

  /**
   * 設置更新模式
   * @param mode 更新模式
   */
  public setUpdateMode(mode: enumUpdateMode) {
    // 如果模式沒有變化 不做任何事
    if (this.updateMode === mode) return;

    const prevMode: enumUpdateMode = this.updateMode;
    this.updateMode = mode;

    // 從任何模式切換到WINDOW_RESIZE
    if (mode === enumUpdateMode.WINDOW_RESIZE) {
      // 只有在還沒有註冊事件監聽器的情況下才註冊
      if (this.bindResizeHandler === null) {
        this.keepUpdateFrame(game.frameRate as number);
        this.bindResizeHandler = {
          handleEvent: () => {
            this.keepUpdateFrame(game.frameRate as number);
          },
        };
        window.addEventListener('resize', this.bindResizeHandler);
      }
    }
    // 從WINDOW_RESIZE切換到任何其他模式
    else if (prevMode === enumUpdateMode.WINDOW_RESIZE) {
      // 移除事件監聽器
      this.clearBindResizeHandler();
    }

    // 如果切換到ALWAYS模式 立即更新一次
    if (mode === enumUpdateMode.ALWAYS && this.syncNode !== null) {
      this.updateSyncNode();
    }
  }

  /**
   * 設定同步3D節點所使用的攝影機
   * @param camera
   */
  public setSync3DCamera(camera: Camera) {
    this.sync3DCamera = camera;
  }

  /**
   * 清除初始狀態
   * 釋放資源並重置所有相關屬性
   */
  private clearSyncNodeInitInfo() {
    if (this.initCurrentNode !== null) this.initCurrentNode.destroy();
    this.initCurrentNode = null;
    if (this.initSyncNode !== null) this.initSyncNode.destroy();
    this.initSyncNode = null;

    this.initSyncWorldPosition = null;
    this.initCurrentWorldPosition = null;
    this.initWorldPositionOffset = null;
  }

  /**
   * 清除視窗調整事件監聽器
   * 這個方法用於取消註冊resize事件處理器
   */
  private clearBindResizeHandler() {
    if (this.bindResizeHandler !== null)
      window.removeEventListener('resize', this.bindResizeHandler);
    this.bindResizeHandler = null;
  }

  /**
   * 更新同步節點
   */
  private updateSyncNode() {
    // 防止空引用
    if (
      !this.syncNode ||
      !this.node ||
      !this.initCurrentNode ||
      !this.initSyncNode
    ) {
      return;
    }

    //同步3D節點位置
    if (
      this.isSync3DNode &&
      this.sync3DCamera !== null &&
      this.node.parent !== null
    ) {
      const syncNodeUIPosition: Vec3 = new Vec3();
      this.sync3DCamera.convertToUINode(
        this.syncNode.worldPosition,
        this.node.parent,
        syncNodeUIPosition
      );

      if (!this.initSync3DUIPosition) {
        this.initSync3DUIPosition = new Vec3();

        this.sync3DCamera.convertToUINode(
          this.initSyncWorldPosition,
          this.node.parent,
          this.initSync3DUIPosition
        );
      }

      this.node.setPosition(
        this.initCurrentNode.position.x +
          (syncNodeUIPosition.x - this.initSync3DUIPosition.x),
        this.initCurrentNode.position.y +
          (syncNodeUIPosition.y - this.initSync3DUIPosition.y)
      );

      if (this.isSyncOpacity) {
        if (!this.syncNode.activeInHierarchy) {
          setOpacity(this.node, 0);
        } else {
          setOpacity(this.node, getOpacity(this.initCurrentNode));
        }
      }
    } else {
      // 同步啟用狀態 (透明度取代顯示隱藏 避免update失效)
      if (!this.syncNode.activeInHierarchy) {
        setOpacity(this.node, 0);
        return;
      } else {
        setOpacity(this.node, getOpacity(this.initCurrentNode));
      }

      //同步位置
      if (this.isSyncPosition) {
        this.node.setPosition(
          this.initCurrentNode.position.x +
            (this.syncNode.position.x - this.initSyncNode.position.x),
          this.initCurrentNode.position.y +
            (this.syncNode.position.y - this.initSyncNode.position.y)
        );
      }

      //藉由世界座標同步位置
      if (this.isSyncPositionByWorld) {
        const syncNodeWorldPosition: Vec3 = getWorldSpaceAR(this.syncNode);
        const newLocPos: Vec3 = getNodeSpaceAR(
          this.node.parent,
          syncNodeWorldPosition.add(this.initWorldPositionOffset)
        );

        this.node.setPosition(newLocPos);
      }

      //完全同步世界座標位置
      if (this.isSyncPositionByWorldExact) {
        const syncNodeWorldPosition: Vec3 = getWorldSpaceAR(this.syncNode);
        const newLocalPosition: Vec3 = getNodeSpaceAR(
          this.node.parent,
          syncNodeWorldPosition
        );
        this.node.setPosition(newLocalPosition);
      }

      //同步顏色
      if (
        this.isSyncColor &&
        nodeEx(this.initCurrentNode).color &&
        nodeEx(this.syncNode).color
      ) {
        const color: Color = Color.clone(nodeEx(this.initCurrentNode).color);
        color.multiply(getColor(this.syncNode));
        //若不預先處理alpha Cocos會報警示訊息
        const alpha: number = color.a / 255.0;
        color.r = Math.floor(color.r * alpha);
        color.g = Math.floor(color.g * alpha);
        color.b = Math.floor(color.b * alpha);
        color.a = 255;
        // 只有當顏色確實變化時才設置
        if (!getColor(this.node).equals(color)) setColor(this.node, color);
      }
      //同步透明
      if (this.isSyncOpacity) {
        // 計算新的透明度並確保在有效範圍內
        const newOpacity = Math.floor(
          getOpacity(this.initCurrentNode) * (getOpacity(this.syncNode) / 255)
        );
        setOpacity(this.node, Math.max(0, Math.min(255, newOpacity)));
      }
    }

    //同步角度
    if (this.isSyncRotation) {
      Vec3.subtract(
        this.deltaSyncEuler,
        this.syncNode.eulerAngles,
        this.initSyncNode.eulerAngles
      );

      Vec3.add(
        this.node.eulerAngles,
        this.initCurrentNode.eulerAngles,
        this.deltaSyncEuler
      );

      this.node.setRotationFromEuler(this.node.eulerAngles);
    }

    //同步縮放
    if (this.isSyncScale) {
      const currentScale = this.initCurrentNode.getScale();
      const syncNodeScale = this.syncNode.getScale();
      const initSyncNodeScale = this.initSyncNode.getScale();
      const initSyncNodeScaleX =
        initSyncNodeScale.x === 0 ? 1 : initSyncNodeScale.x;
      const initSyncNodeScaleY =
        initSyncNodeScale.y === 0 ? 1 : initSyncNodeScale.y;
      this.node.setScale(
        currentScale.x * (syncNodeScale.x / initSyncNodeScaleX),
        currentScale.y * (syncNodeScale.y / initSyncNodeScaleY)
      );
    }
  }

  /**
   * 持續更新幾幀 用於確保同步節點狀態
   * @param count
   */
  private keepUpdateFrame(count?: number) {
    if (count === null || isNaN(count)) count = Number(game.frameRate);

    this.updateSyncNode();

    count--;

    if (count <= 0) return;

    director.once(
      Director.EVENT_AFTER_UPDATE,
      () => {
        //若無同步對象或節點無效 則不繼續更新
        if (this.syncNode === null || !this.node.isValid) return;

        this.keepUpdateFrame(count);
      },
      this
    );
  }

  /**
   * 複製節點必要屬性到目標節點
   * @param sourceNode 來源節點
   * @param targetNode 目標節點
   */
  private copyNodeProperty(sourceNode: Node, targetNode: Node): void {
    if (!sourceNode || !targetNode) {
      console.warn(
        '[SyncNodeProperty] copyNodeProperty: Source or target node is null'
      );
      return;
    }

    targetNode.position = v3(sourceNode.position);
    targetNode.eulerAngles = v3(sourceNode.eulerAngles);
    targetNode.scale = sourceNode.scale;
    const targetNodeEx = nodeEx(targetNode);
    const sourceNodeEx = nodeEx(sourceNode);
    if (targetNodeEx.color)
      targetNodeEx.color = sourceNodeEx.color
        ? Color.clone(sourceNodeEx.color)
        : color(255, 255, 255, 255);
    if (sourceNodeEx.opacity) {
      targetNode.addComponent(UIOpacity).opacity = sourceNodeEx.opacity;
    }
  }
}

/** 同步節點參數 */
interface SyncNodePropertyParam {
  updateMode?: enumUpdateMode;
  isSyncPosition?: boolean;
  isSyncPositionByWorld?: boolean;
  isSyncPositionByWorldExact?: boolean;
  isSyncRotation?: boolean;
  isSyncScale?: boolean;
  isSyncColor?: boolean;
  isSyncOpacity?: boolean;
  isSync3DNode?: boolean;
  sync3DCamera?: Camera;
}
