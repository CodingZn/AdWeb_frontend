import { Mesh, Object3D } from "three";
import { AssetManager } from "./AssetManager";
import { IRenderable, Renderable } from "./Renderable";

export interface IObjectParams extends IRenderable {
  url?: string | string[],
  onLoad?: (object: Object3D) => any 
}

export interface IObjectManagerOption {
  assetManager: AssetManager
}

export class ObjectManager {
  private objectMap: Map<string, Renderable>;
  private assetManager: AssetManager;

  constructor(options: IObjectManagerOption) {
    this.objectMap = new Map();
    this.assetManager = options.assetManager;
  }

  /**
   * 通过物体的唯一名称获取物体，若不存在则创建一个
   * @param name 
   * @param params 
   * @returns 
   */
  public get(name: string, params?: IObjectParams) {
    const { objectMap } = this;
    let renderable = objectMap.get(name);
    if (renderable) {
      return renderable as Renderable;
    }
    // todo 改造成不同类型
    let newRenderable = new Renderable(params);
    // 加载物体模型，加载完成后回调 onLoad
    if (params?.url) {
      const url = params.url as string | string[];
      const self = this;
      this.assetManager
      .get(url)
      .then((object) => {
        console.log('load', url, object)
        self.onLoad(newRenderable, object);
        if (params.onLoad) {
          params.onLoad(object as Object3D);
        }
      })
    }
    objectMap.set(name, newRenderable);
    return newRenderable;
  }

  /**
   * 异步获取物体
   * @param name 
   * @param params 
   * @returns 
   */
  public getAsync(name: string, params?: IObjectParams) {
    const { get } = this;
    return new Promise((resolve) => {
      const newParams = params || {};
      newParams.onLoad = (object) => {
        resolve(object);
      }
      get(name, newParams);
    })
  }

  private onLoad(renderable: Renderable, object: Object3D | Object3D[]) {
    if (Array.isArray(object)) {
      const objects = object as Object3D[];
      const self = this;
      objects.forEach(object => {
        self.onLoad(renderable, object);
      })
    } else {
      // todo 后续添加纹理等操作
      const object3D = object as Object3D;
      if (object3D.isObject3D) {
        object3D.traverse((child: Object3D) => {
          if ( (child as Mesh).isMesh ) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
          renderable.add(object);
        });
      }

    }
  }
}