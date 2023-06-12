import { EventDispatcher, EventListener } from "three";

export interface IDisposable {
	dispose(): void;
}

export abstract class Disposable implements IDisposable {
	private readonly _store = new DisposableStore();

	constructor() {}

  // 处理事件发射器
	public dispose(): void {
		this._store.dispose();
	}

  // 注册一个事件发射器
	protected _register<T extends IDisposable>(t: T): T {
		if ((t as unknown as Disposable) === this) {
			throw new Error('Cannot register a disposable on itself!');
		}
		return this._store.add(t);
	}
}

export class DisposableStore implements IDisposable {
	private _toDispose = new Set<IDisposable>();
	private _isDisposed = false;

  // 处置所有注册的 Disposable，并将其标记为已处置
  // 将来添加到此对象的所有 Disposable 都将在 add 中处置。
	public dispose(): void {
		if (this._isDisposed) {
			return;
		}

		this._isDisposed = true;
		this.clear();
	}

	public clear(): void {
		this._toDispose.forEach(item => item.dispose());
		this._toDispose.clear();
	}


	public add<T extends IDisposable>(t: T): T {
    // 如果已处置，则不添加
		if (this._isDisposed) {
		} else {
      // 未处置，则可添加
			this._toDispose.add(t);
		}
		return t;
	}
}

export interface IEventDispatcher {
  addEventListener: (...args: any) => any;
  removeEventListener: (...args: any) => any;
}

export function addDisposableEventListener(el: IEventDispatcher, eventName: string, listener: (e: Event) => any): IDisposable {
	el.addEventListener(eventName, listener);
	return {
		dispose: () => el.removeEventListener(eventName, listener)
	}
}