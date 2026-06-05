declare let effekseer; // effekseer module
declare let WebAssembly;
//kyy看不懂
namespace efk_core {
  export const defaultFPS = 60; // FPS for effekseer running

  export const context: any = null; // effekseer context
  export const canvas: HTMLCanvasElement = null; // creator canvas

  export const camera: cc.Camera = null; // creator camera
  export const isCameraDrity = false; // to reset effekseer's matrices?

  export const isDone = false; // is effekseer initialized?
  export const isEfkAppended = false; // is effekseer.js appended?
  export const isEfkWasmAppended = false; // is effekseer.wasm appended?

  export const efkLookup: Map<string, any> = new Map(); // load effect once & keep it in table
  export const preloadEffect: Map<string, Function> = new Map(); // load effect when done

  export const isEFKEnable = true; // enable or not
  export const efkCompCnt = 0; // how many efk components are running?

  /**
   * get the global effekseer module
   */
  export function getEfkModule(): any {
    return effekseer;
  }

  /**
   * get the node's world rotation
   */
  export function getWorldRotation(node: cc.Node): cc.Vec3 {
    const a = cc.v3(); // eular angles
    const q = cc.quat();
    node['getWorldRotation'](q); // This is not a public API yet, its usage could be updated
    q.toEuler(a);
    return a;
  }

  /**
   * get the node's world scale
   */
  export function getWorldScale(node: cc.Node): cc.Vec3 {
    const s = cc.v3();
    node['getWorldScale'](s); // This is not a public API yet, its usage could be updated
    return s;
  }

  /**
   * get the node's world matrix dirty
   */
  export function getWorldDirty(node: cc.Node): boolean {
    if (node['_worldMatDirty']) {
      return node['_worldMatDirty'];
    } else {
      if (node.parent) {
        return efk_core.getWorldDirty(node.parent);
      } else {
        return true;
      }
    }
  }

  /**
   * get camera projection matrix for effekseer
   */
  export function getProjectionMatrix(): number[] {
    const cvs = efk_core.canvas;
    const cam = efk_core.camera;

    if (cvs && cam) {
      const proj = cc.mat4();
      if (cam.ortho) {
        const hh = cam.orthoSize;
        const hw = hh * (cvs.width / cvs.height);
        cc.Mat4.ortho(proj, -hw, hw, -hh, hh, cam.nearClip, cam.farClip);
      } else {
        let fov = cam.fov * cc.macro.RAD; // creator 引擎裡面拿出來的
        fov = Math.atan(Math.tan(fov / 2) / cam.zoomRatio) * 2; // creator 引擎裡面拿出來的
        cc.Mat4.perspective(
          proj,
          fov,
          cvs.width / cvs.height,
          cam.nearClip,
          cam.farClip
        );
      }
      return <number[]>(proj.m as any);
    }

    return <number[]>(cc.mat4().identity().m as any);
  }

  /**
   * stop all effects
   */
  export function stopAll() {
    if (efk_core.isDone) {
      efk_core.context.stopAll();
    }
  }

  /**
   * release all loaded effects
   */
  export function releaseAll() {
    if (efk_core.isDone) {
      efk_core.efkLookup.forEach((state, _url) => {
        efk_core.context.releaseEffect(state);
      });
      efk_core.efkLookup.clear();
    }
  }

  /**
   * effekseer initialization
   */
  export function init(ver?: string) {
    if (!cc.sys.isBrowser) return;
    if (!efk_core.isEfkAppended) {
      efk_core.isEfkAppended = true;

      // check wasm supporting
      const use_wasm =
        typeof WebAssembly === 'object' &&
        typeof WebAssembly.instantiate === 'function';

      const _ver = ver ? ver : '';
      const suffix = use_wasm ? '.min' : '_asmjs.min';
      const jsElement = document.createElement('script');
      jsElement.setAttribute('language', 'JavaScript');
      jsElement.setAttribute(
        'src',
        `effekseer/core/effekseer${_ver}${suffix}.js`
      );
      document.body.appendChild(jsElement);
      // init effekseer.wasm, when effekseer.js is loaded
      jsElement.onload = () => {
        if (!efk_core.isEfkWasmAppended) {
          efk_core.isEfkWasmAppended = true;

          if (!efk_core.getEfkModule()) {
            console.error('Effekseer module loading failed.');
            return;
          }

          const gameCanvas = document.getElementById(
            'GameCanvas'
          ) as HTMLCanvasElement;
          if (use_wasm) {
            efk_core.getEfkModule().initRuntime(
              `./effekseer/core/effekseer${_ver}.wasm`,
              () => mixInCreatorPipeline(gameCanvas),
              () => {}
            );
          } else {
            mixInCreatorPipeline(gameCanvas);
          }
        }
      };
    }
  }

  /**
   * create context and inject the effekseer into creator's pipeline
   */
  // eslint-disable-next-line no-inner-declarations
  function mixInCreatorPipeline(canvas: HTMLCanvasElement) {
    if (!efk_core.isDone) {
      // create the context
      if (!efk_core.context) {
        efk_core.context = efk_core.getEfkModule().createContext();
        efk_core.context.init(canvas.getContext('webgl'));
      }

      // upvalues for draw function
      const mat4 = cc.mat4();
      const defaultFPS = efk_core.defaultFPS;

      // effekseer draw function
      const efk_draw = () => {
        const core = efk_core;

        if (core.isEFKEnable && core.efkCompCnt > 0) {
          const core_camera = core.camera;
          const core_context = core.context;

          if (core_camera && core_context) {
            if (core.isCameraDrity) {
              core.isCameraDrity = false;
              core_camera.node.getWorldMatrix(mat4);
              core_context.setProjectionMatrix(core.getProjectionMatrix());
              core_context.setCameraMatrix(mat4.invert().m);
            }
            core_context.update(cc.director.getDeltaTime() * defaultFPS);
            core_context.draw();
          }
        }
      };

      // hack to creator's rendering system
      const render = cc.renderer['_forward']._render;
      cc.renderer['_forward']._render = function (view, scene) {
        render.call(this, view, scene);
        if (view._priority === -1) {
          // it depends on what the rendering order do you want
          efk_draw();
        }
      };

      // update effekseer statements
      efk_core.canvas = canvas;
      efk_core.isDone = true;

      // load effect when done
      efk_core.preloadEffect.forEach((finished, url) => {
        if (!efk_core.isEFKEnable) {
          return;
        }
        if (!efk_core.efkLookup.has(url)) {
          const state = efk_core.context.loadEffect(
            url,
            1,
            () => {
              // called when loading is finished.
              // console.log('loaded: ' + url);
              if (finished) {
                finished();
              }
            },
            (msg: string, url: string) => {
              // called when error causes.
              console.log(msg, url);
            }
          );
          efk_core.efkLookup.set(url, state); // keep it
        }
      });
      efk_core.preloadEffect.clear();
    }
  }
}

export default efk_core;
