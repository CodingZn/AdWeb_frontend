import { Loader, FileLoader, ObjectLoader, TextureLoader, CubeTextureLoader } from "three";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export interface ILoader extends Loader {
  load(
    url: string, 
    onLoad?: (...args: any) => any, 
    onProgress?: (...args: any) => any, 
    onError?: (...args: any) => any): void;
  loadAsync(
    url: string, 
    onProgress?: (...args: any) => any): Promise<any>;
}

export interface IBundleLoader extends Loader {
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

// 资源 url 匹配
interface Matcher {
  test: RegExp,
  use: Constructor<any>
}
const LoaderMatcher: Matcher[] = [
  { test: /(jpg|png|jpeg)$/, use: TextureLoader },
  { test: /(obj)$/, use: OBJLoader },
  { test: /(fbx)$/, use: FBXLoader },
  { test: /(json)$/, use: ObjectLoader },
  { test: /./, use: FileLoader }
]

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
  public get(url: string | string[], loader?: Loader): Promise<any> | Promise<any[]> {
    if (Array.isArray(url)) {
      const urls = url as string[];
      return this.loadAssets(urls);
    } else {
      const { assetMap } = this;
      const res = assetMap.get(url);
      if (res === undefined) {
        return this.loadAsset(url, loader as ILoader | undefined).then(res => {
          assetMap.set(url, res);
          return res;
        });
      }
      return Promise.resolve(res);
    }
  }

  private loadAsset(url: string, loader?: ILoader) {
    let newLoader: ILoader | undefined;
    if (loader === undefined) {
      for (const { test, use } of LoaderMatcher) {
        if (test.test(url)) {
          newLoader = cached(use) as ILoader;
          break;
        }
      }
    } else {
      newLoader = loader;
    }
    if (newLoader === undefined) {
      return Promise.reject('No loader matches!');
    }
    newLoader.setPath(this.assetsPath);
    return newLoader.loadAsync(url);
  }

  private loadAssets(urls: string[]) {
    // 只有 CubeTextureLoader 加载多个文件
    const loader = cached(CubeTextureLoader) as IBundleLoader;
    loader.setPath(this.assetsPath);
    return loader.loadAsync(urls);
  }
}