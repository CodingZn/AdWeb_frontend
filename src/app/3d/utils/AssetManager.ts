import { Loader,CubeTextureLoader, FileLoader, Object3D } from "three";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export interface ILoader extends Loader {
  load(
    urls: string[], 
    onLoad?: (...args: any) => any, 
    onProgress?: (...args: any) => any, 
    onError?: (...args: any) => any): void;
  loadAsync(
    urls: string[], 
    onProgress?: (...args: any) => any): Promise<any>;
}

export interface IAssetManagerOption {
  assets?: string[],
  assetsPath: string,
}

// loader 实例缓存处理
type Constructor<T> = new (...args: any) => T;
const loaderCacheMap: Map<Constructor<Loader>, Loader> = new Map();
function cached(loaderClass: Constructor<Loader>) {
  let loader = loaderCacheMap.get(loaderClass);
  if (loader === undefined) {
    loader = new loaderClass();
    loaderCacheMap.set(loaderClass, loader);
  }
  return loader;
}

export class AssetManager {
  private assetMap: Map<string, any>;
  private assetsPath: string;

  constructor(private options: IAssetManagerOption) {
    this.assetMap = new Map();
    this.assetsPath = options.assetsPath;
  }

  /**
   * 通过静态资源地址加载
   * @param url 
   * @param loader 
   * @returns 
   */
  public get(url: string | string[], loader?: Loader) {
    if (Array.isArray(url)) {
      if (loader) {
        const urls = url as string[];
        return this.loadAssets(urls, loader as ILoader);
      } else {
        return Promise.reject('todo 多资源加载暂时需要指定加载器');
      }
    } else {
      const res = this.assetMap.get(url);
      if (res === undefined) {
        return this.loadAsset(url, loader as ILoader);
      }
      return Promise.resolve(res);
    }
  }

  private loadAsset(url: string, loader?: ILoader) {
    let newLoader: Loader;
    if (loader === undefined) {
      if (/(jpg|png|jpeg)$/.test(url)) {
        newLoader = cached(CubeTextureLoader);
      } else if (/(obj)$/.test(url)) {
        newLoader = cached(OBJLoader);
      } else if (/(fbx)$/.test(url)) {
        newLoader = cached(FBXLoader);
      } else {
        newLoader = cached(FileLoader);
      }
    } else {
      newLoader = loader;
    }
    newLoader.setPath(this.assetsPath);
    return (newLoader as ILoader).loadAsync([url]);
  }

  private loadAssets(urls: string[], loader: ILoader) {
    loader.setPath(this.assetsPath);
    return loader.loadAsync(urls);
  }
}