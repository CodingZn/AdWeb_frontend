import { AmbientLight, AxesHelper, Color, Scene, WebGLRenderer } from "three";
import { AssetManager } from "./AssetManager";
import { IObjectParams, ObjectManager } from "./ObjectManager";
import { ICameraParams, PerspectiveManager, PerspectiveType } from "./PerspectiveManager";

export interface ISceneManagerOption {
  container: HTMLElement,
  assetsPath: string,
  assets?: string[],
}

export interface ISceneParams {
  background?: number,
  ambient?: number,
  axes?: boolean,
}

const defaultOption: ISceneManagerOption = {
  container: document.body,
  assetsPath: 'assets/',
}

const defaultParams = {
  background: 0xa0a0a0,
  ambient: 0xaaaaaa,
  light: 0xaaaaaa,
  axes: false
}

export class SceneManager {
  private options: ISceneManagerOption;
  private activeScene: Scene | null;
  private sceneMap: Map<string, Scene>;
  private renderer: WebGLRenderer;
  private assetManager: AssetManager;
  private objectManager: ObjectManager;
  private perspectiveManager: PerspectiveManager;

  constructor(options: ISceneManagerOption) {
    this.activeScene = null;
    this.sceneMap = new Map();
    this.options = Object.assign(defaultOption, options);

    // init renderer
    this.renderer = new WebGLRenderer();
    this.renderer.shadowMap.enabled = true;
    const { container } = this.options;
    const { width, height } = container.getBoundingClientRect();
    this.renderer.setSize( width, height );
    container.appendChild(this.renderer.domElement);

    // init managers
    this.assetManager = new AssetManager(options);
    this.objectManager = new ObjectManager({ assetManager: this.assetManager });
    this.perspectiveManager = new PerspectiveManager({ aspect: width / height });
  }

  /**
   * 切换场景
   * @param name 唯一的场景名称。若不存在则创建一个场景
   */
  public switchScene(name: string, params?: ISceneParams) {
    let scene = this.sceneMap.get(name);
    if (scene === undefined) {
      scene = new Scene();
      this.sceneMap.set(name, scene);
    }
    // 配置场景参数
    // todo 更多参数
    const { background, ambient, axes } = Object.assign(defaultParams, params);
    background && (scene.background = new Color(background));
    ambient && (scene.add(new AmbientLight(ambient)));
    axes && (scene.add(new AxesHelper(10000)));
    // 切换
    this.activeScene = scene;
  }

  /**
   * 切换相机
   */
  public switchCamera(type: PerspectiveType) {
    this.perspectiveManager.switch(type);
  }

  /**
   * 更新相机
   */
  public updateCamera(params: ICameraParams) {
    this.perspectiveManager.update(params);
  }

  /**
   * 移动相机
   */
  public moveCamera(params: { x?: number, y?: number, z?: number }) {
    this.perspectiveManager.move(params);
  }

  /**
   * 
   * @param name 物体的唯一名称。若不存在，将会根据参数新建一个物体
   * @param params 
   * @returns 
   */
  public add(name: string, params?: IObjectParams) {
    const { activeScene, objectManager } = this;
    const renderable = objectManager.get(name, params);
    if (activeScene === null) {
      console.warn('No scene to add object to!');
    } else {
      activeScene.add(renderable.object);
    }
    return renderable;
  }

  public render() {
    const { renderer, activeScene, perspectiveManager: { camera } } = this;
    if (activeScene && camera) {
      renderer.render( activeScene, camera );
    }
  }
}