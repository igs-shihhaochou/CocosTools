//https://forum.cocos.org/t/topic/150715/3

import {
  Canvas,
  director,
  DynamicAtlasManager,
  isValid,
  Layers,
  Layout,
  macro,
  Node,
  ScrollView,
  Sprite,
  SpriteFrame,
  UITransform,
  v3,
  view,
} from 'cc';

export class DynamicAtlasUtil {
  _debugNode: Node = null;

  public showDynamicAtlasDebug(show): Node {
    const canvas = director.getScene().getComponentInChildren(Canvas)?.node;

    const mgr = DynamicAtlasManager.instance;

    console.log(`DebugUtils-> ${mgr.enabled},${macro.CLEANUP_IMAGE_CACHE}`);

    let _debugNode = this._debugNode;

    if (show) {
      const addToScene = content => {
        const fn = atlasObj => {
          for (let i = 0; i <= atlasObj._atlasIndex; i++) {
            const node = new Node(atlasObj.name || 'ATLAS');

            node.layer = Layers.Enum.UI_2D;

            const texture = atlasObj._atlases[i]._texture;

            const spriteFrame = new SpriteFrame();

            spriteFrame.texture = texture;

            const sprite = node.addComponent(Sprite);

            sprite.spriteFrame = spriteFrame;

            node.parent = content;
          }
        };

        fn(mgr);
      };

      if (!_debugNode || !_debugNode.isValid) {
        const width = view.getVisibleSize().width;

        const height = view.getVisibleSize().height;

        _debugNode = new Node('DYNAMIC_ATLAS_DEBUG_NODE');

        const transform = _debugNode.addComponent(UITransform);

        transform.width = width;

        transform.height = height;

        _debugNode.setSiblingIndex(999);

        _debugNode.parent = canvas;

        _debugNode.layer = Layers.Enum.UI_2D;

        const scroll = _debugNode.addComponent(ScrollView);

        const content = new Node('CONTENT');

        const layout = content.addComponent(Layout);

        layout.type = Layout.Type.VERTICAL;

        layout.resizeMode = Layout.ResizeMode.CONTAINER;

        const contentTR = content.addComponent(UITransform);

        content.parent = _debugNode;

        contentTR.width = mgr.textureSize;

        contentTR.anchorY = 1;

        content.position = v3(mgr.textureSize, 0, 0);

        content.layer = Layers.Enum.UI_2D;

        scroll.content = content;

        addToScene(content);

        this._debugNode = _debugNode;
      } else {
        const content = _debugNode.getChildByName('CONTENT');

        content.destroyAllChildren();

        addToScene(content);
      }

      return _debugNode;
    } else {
      if (_debugNode && isValid(_debugNode)) {
        _debugNode.parent = null;

        _debugNode.destroy();
      }
    }

    this._debugNode = _debugNode;
    return null;
  }
}
