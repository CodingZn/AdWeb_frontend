import { Observable, tap } from 'rxjs';
import { SocketContext } from './socketUtils';

export type Operator<T> = (o: Observable<T>) => Observable<T>;
export type ContextWrappedOperator<T> = (ctx: SocketContext) => Operator<T>;

export const debugOutput = <T extends Object>(
  scope: string,
  mapper: (data: T) => string = (data: T) => data.toString()
) =>
  tap<T>((data: T) => {
    console.debug(`debug :: ${scope} :: ${mapper(data)}`);
  });
