import { Mesh, Object3D } from "three";
import { AssetManager } from "./AssetManager";
import { IRenderable, Renderable } from "./Renderable";

export interface IObjectParams extends IRenderable {
  url?: string,
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
    let newRenderable = new Renderable(params);
    // 加载物体模型，加载完成后回调 onLoad
    if (params?.url) {
      const url = params.url as string;
      this.assetManager
      .get(url)
      .then((object) => {
        // todo 后续添加纹理等操作
        const object3D = object as Object3D;
        if (object3D.isObject3D) {
          object3D.traverse((child: Object3D) => {
            if ( (child as Mesh).isMesh ) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
        }
        console.log('load: ', object);
        newRenderable.add(object);
        
        if (params.onLoad) {
          params.onLoad(object);
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
}