import { IRenderableParams, IRenderableState, Renderable } from "./Renderable";
import { FontLoader  } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { AssetManager } from "../managers/AssetManager";
import { assign } from "lodash";
import { MeshBasicMaterial, Mesh } from "three";

export interface ITextParams extends IRenderableParams {
  content?: string;
  size?: number;
  height?: number;
  color?: number;
  font?: string;
  fontStyle?: string;
}

export interface ITextState extends IRenderableState {
  content: string;
  size: number;
  font: string;
  height: number;
  color: number;
  fontStyle: string;
}

const defaultTextParams = () => ({
  content: '',
  size: 20,
  height: 1,
  color: 0x000000,
  font: 'helvetiker',
  fontStyle: 'regular'
})

const fontLoader = new FontLoader();

export class Text extends Renderable {
  private assetManager: AssetManager;
  private content: string;
  private size: number;
  private height: number;
  private color: number;
  private font: string;
  private fontStyle: string;
  private material: MeshBasicMaterial;
  private geometry: TextGeometry | null = null;
  private mesh: Mesh | null = null;
  
  constructor(params:ITextParams, assetManager: AssetManager) {
    super(params);
    this.assetManager = assetManager;
    const { font, fontStyle, content, size, color, height } = assign(defaultTextParams(), params);
    this.font = font;
    this.fontStyle = fontStyle;
    this.content = content;
    this.size = size;
    this.height = height;
    this.color = color;
    this.name = 'text';
    this.material = new MeshBasicMaterial({ color });
    this.loadFont();
  }

  public override get state(): ITextState {
    const { content, font, fontStyle, size, height, color } = this;
    return assign({ content, font, fontStyle, size, height, color }, super.state);
  }

  public override update(params: ITextParams) {
    const self = this;
    let changed = false;
    if (params.color !== undefined && params.color !== this.state.color) {
      this.material.color.setHex(params.color);
    }
    ['content', 'font', 'fontStyle', 'height', 'size'].forEach((v)  => {
      const key = v as keyof ITextState;
      if (params[key] !== undefined && params[key] !== this.state[key]) {
        changed = true;
        (self as any)[key] = params[key];
      }
    })
    if (changed) {
      this.loadFont();
    }
    return super.update(params);
  }

  private loadFont() {
    const self = this;
    const { content, size, height } = this;
    this.assetManager.get(`fonts/${this.font}_${this.fontStyle}.typeface.json`, { loader: fontLoader })
    .then(font => {
      self.geometry = new TextGeometry(content, {
        font,
        size,
        height,
      });
      if (self.mesh !== null) {
        self.mesh.clear();
      }
      self.mesh = new Mesh(self.geometry, self.material);
      self.add(self.mesh);
    })
  }
}