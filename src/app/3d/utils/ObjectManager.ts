import { AssetManager } from "./AssetManager";
import { IRenderable, Renderable } from "./Renderable";

export interface IObjectParams extends IRenderable {
  url?: string | string[],
  onLoad?: (resources: any[]) => any 
}

export interface IObjectManagerOption {
  assetsPath: string
}

export class ObjectManager {
  private objectMap: Map<string, Renderable>;
  private assetManager: AssetManager;

  constructor(options: IObjectManagerOption) {
    this.objectMap = new Map();
    this.assetManager = new AssetManager(options);
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
    let newRenderable = new Renderable(Object.assign(params as IRenderable, { name } as IRenderable));
    // 加载物体模型，加载完成后回调 onLoad
    if (params?.url) {
      const url = params.url as string | string[];
      this.assetManager
      .get(url)
      .then((resource) => {
        let resources: any[] = [];
        if (Array.isArray(resource)) {
          resources.push(...resource);
        } else {
          resources.push(resource);
        }
        newRenderable.onLoad(resources);
        if (params.onLoad) {
          params.onLoad(resources);
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