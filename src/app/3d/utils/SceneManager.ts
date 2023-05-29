import { AmbientLight, AxesHelper, Camera, Color, DirectionalLight, Scene, WebGLRenderer } from "three";
import { Renderable } from "./Renderable";

export interface ISceneManagerOption {
  container: HTMLElement,
  assets?: string[],
}

export interface ISceneParams {
  background?: number,
  ambient?: number,
  axes?: boolean,
}

const defaultOption: ISceneManagerOption = {
  container: document.body,
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
  private sun: DirectionalLight;

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

    // init sun
    // todo 目前 sun 不可配置
    const sun = new DirectionalLight( 0xaaaaaa );
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
    this.sun = sun;
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
    }
    // 配置场景参数
    // todo 更多参数
    const { background, ambient, axes } = Object.assign(defaultParams, params);
    background && (scene.background = new Color(background));
    ambient && (scene.add(new AmbientLight(ambient)));
    axes && (scene.add(new AxesHelper(10000)));
    return scene;
  }

  /**
   * 切换场景
   * @param name 唯一的场景名称。若不存在则创建一个场景
   */
  public switch(name: string, params?: ISceneParams) {
    let scene = this.get(name, params);
    // 切换
    this.activeScene = scene;
    this.activeScene.add(this.sun);
    return scene;
  }

  /**
   * 将加入场景
   * @param renderable 
   * @returns 
   */
  public add(renderable: Renderable) {
    const { activeScene } = this;
    if (activeScene === null) {
      console.warn('No scene to add object to!');
    } else if (renderable.object.parent !== activeScene) {
      activeScene.add(renderable.object);
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
}