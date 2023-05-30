import { IViewOption, View } from "./View"

export interface ITownViewOption extends IViewOption {}

export class TownView extends View {
  constructor(option: ITownViewOption) {
    super(option);
  }

  public mount() {
    throw new Error("Method not implemented.")
  }

  public unmount() {
    throw new Error("Method not implemented.")
  }

  public render(dt: number) {
    throw new Error("Method not implemented.")
  }
}