import { AmbientLight, AxesHelper, Camera, Color, DirectionalLight, Object3D, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from "three";
import { Renderable } from "../utils/Renderable";

export interface ISceneManagerOption {
  container: HTMLElement,
  assets?: string[],
}

export interface ISceneParams {
  background?: number,
  ambient?: number | null,
  sun?: number | null,
  axes?: boolean,
}

const defaultOption: () => ISceneManagerOption = () => ({
  container: document.body,
})

const defaultParams = () => ({
  background: 0xa0a0a0,
  ambient: 0xaaaaaa,
  light: 0xaaaaaa,
  axes: false
})

interface ISceneState {
  ambient: AmbientLight | null,
  sun: DirectionalLight | null,
  renderables: Set<Renderable>
}

// todo 目前 sun 不可配置
const sunFactory = (light: number | null) => {
  if (light === null) return null;
  const sun = new DirectionalLight( light );
  sun.position.set( 30, 100, 40 );
  sun.target.position.set( 0, 0, 0 )
  sun.castShadow = true;
  const lightSize = 500;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 500;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -lightSize;
  sun.shadow.camera.right = sun.shadow.camera.top = lightSize;
  
  sun.shadow.bias = 0.0039;
  sun.shadow.mapSize.width = 1024;
  sun.shadow.mapSize.height = 1024;
  return sun;
}


export class SceneManager {
  private options: ISceneManagerOption;
  private activeName: string | null = null;
  private sceneMap: Map<string, Scene> = new Map();
  private stateMap: Map<string, ISceneState> = new Map();
  private paramsMap: Map<string, ISceneParams> = new Map();
  private renderer: WebGLRenderer;
  
  constructor(options: ISceneManagerOption) {
    this.options = Object.assign(defaultOption(), options);

    // init renderer
    this.renderer = new WebGLRenderer();
    this.renderer.shadowMap.enabled = true;

    const { container } = this.options;
    container.appendChild(this.renderer.domElement);
    
    window.addEventListener('resize', this.onResize.bind(this));
    this.onResize();
  }

  public get renderables() { 
    if (this.activeName === null) return new Set<Renderable>();
    return this.stateMap.get(this.activeName)!.renderables;
  }

  /**
   * 
   * @param name 唯一的场景名称。若不存在则创建一个场景
   */
  public get(name: string, params?: ISceneParams) {
    let scene = this.sceneMap.get(name);
    if (scene === undefined) {
      scene = new Scene();
      this.sceneMap.set(name, scene);
      // 配置场景参数
      this._update(name, params || {}, defaultParams())
    }
    return scene;
  }

  public update(params: ISceneParams) {
    if (this.activeName === null) {
      console.warn('No active scene to update!');
    } else {
      this._update(this.activeName, params, this.paramsMap.get(this.activeName));
    }
    return this;
  }

  /**
   * 切换场景
   * @param name 唯一的场景名称。若不存在则创建一个场景
   */
  public switch(name: string, params?: ISceneParams) {
    let scene = this.get(name, params);
    // 切换
    if (this.activeName !== name) {
      this.activeName = name;
    }
    return scene;
  }

  /**
   * 将加入场景
   * @param renderable 
   * @param isCollider 判断 renderable 的所有孩子是否为障碍物
   * @returns 
   */
  public add(renderable: Renderable) {
    const { activeName, activeScene, stateMap } = this;
    if (activeScene === null) {
      console.warn('No scene to add object to!');
    } else {
      activeScene.add(renderable.object);
      stateMap.get(activeName!)!.renderables.add(renderable);
   }
  }

  /**
   * 渲染当前场景
   * @param camera threejs 相机
   */
  public render(camera: Camera | null) {
    const { renderer, activeScene } = this;
    if (activeScene && camera) {
      renderer.render( activeScene, camera );
    }
  }

  public destory() {
    this.options.container.removeChild(this.renderer.domElement);
  }
  /**
   * 获取场景大小
   * @returns 
   */
  public getSize(): { width: number, height: number } {
    const result = new Vector2();
    this.renderer.getSize(result);
    return { width: result.x, height: result.y };
  }

  private _update(name: string, params: ISceneParams, oldParams?: ISceneParams) {
    const scene = this.sceneMap.get(name) as Scene;
    let state = this.stateMap.get(name);
    // 先将旧的移除场景
    if (state !== undefined) {
      if (state.ambient !== null) {
        scene.remove(state.ambient);
      }
      if (state.sun !== null) {
        scene.remove(state.sun);
      }
    } else {
      state = {
        sun: null,
        ambient: null,
        renderables: new Set<Renderable>()
      };
    }
    const newParams = Object.assign(oldParams || {}, params);
    const { background, ambient, sun } = newParams;
    scene.background = new Color(background);
    if (ambient !== undefined) {
      if (ambient === null) {
        state.ambient = null;
      } else {
        state.ambient = new AmbientLight(ambient);
        scene.add(state.ambient);
      }
    }
    if (sun !== undefined) {
      state.sun = sunFactory(sun);
      if (state.sun !== null) {
        scene.add(state.sun);
      }
    }
    this.stateMap.set(name, state);
    this.paramsMap.set(name, newParams);
  }

  private get activeScene() {
    const { activeName, sceneMap } = this;
    if (activeName === null) {
      return null;
    } else {
      return sceneMap.get(activeName) as Scene;
    }
  }

  private onResize() {
    const { width, height } = this.options.container.getBoundingClientRect();
    this.renderer.setSize(width, height);
  }
}