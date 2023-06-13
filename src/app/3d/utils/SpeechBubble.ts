import { assign } from "lodash";
import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, Texture } from "three";
import { METER } from "../characters/Character";
import { AssetManager } from "../managers/AssetManager";
import { cachedGeometry, cachedMaterial } from "./cache";
import { IRenderableParams, Renderable } from "./Renderable";

export interface ISpeechBubbleParams extends IRenderableParams {
  size?: number;
  font?: string; 
  padding?: number;
  color?: string;
  width?: number;
  height?: number;
  message?: string;
}

export interface ISpeechBubbleState extends ISpeechBubbleParams {
  size: number;
  font: string; 
  padding: number;
  color: string;
  width: number;
  height: number;
  message: string
}

const defaultSpeechBubbleParams: () => ISpeechBubbleState = () => ({ 
  message: '',
  font: 'Calibri', 
  size: 20, 
  padding: 0.05 * METER, 
  color: '#222', 
  width: 1.5 * METER, 
  height: METER
});


export class SpeechBubble extends Renderable {
  private assetManager: AssetManager;
  private mesh: Mesh;
  private img: any;
  private params: ISpeechBubbleState;
  private ctx!: CanvasRenderingContext2D;
  
  constructor(params: ISpeechBubbleParams, assetManager: AssetManager) {
    const newParams = assign(defaultSpeechBubbleParams(), params) as ISpeechBubbleState;
    super(newParams);
    this.params = newParams;
    this.assetManager = assetManager;
    const { name, width, height } = this.params;
    this.mesh = new Mesh(
      cachedGeometry(PlaneGeometry, width, height),
      new MeshBasicMaterial()
    );
    if (name) this.mesh.name = name;
    const self = this;
    assetManager.get('images/speech.png')
    .then(texture => {
      const material = self.mesh.material as MeshBasicMaterial;
      self.img = texture.image;
      material.map = texture;
			material.transparent = true;
			material.needsUpdate = true;
      self.update(self.params);
    });
    this.add(this.mesh);
  }

  public override update(params: ISpeechBubbleParams) {
    const { width, height, message, font, color, size } = assign(this.params, params);
      
    const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d')!;
		ctx.font = `${size}pt ${font}`;
		ctx.fillStyle = color;
		ctx.textAlign = 'center';
    this.ctx = ctx;
    const material = this.mesh.material as MeshBasicMaterial;
    material.map = new CanvasTexture(canvas);
    
    if (this.img) {
      const bg = this.img;
      this.ctx.clearRect(0, 0, width, height);
      this.ctx.drawImage(bg, 0, 0, bg.width, bg.height, 0, 0, width, height);
      this.wrapText(message);
      material.map.needsUpdate = true;
    }
    return super.update(params);
  }

  private wrapText(text: string) {
    const { ctx } = this;
    const { width, height, size, padding } = this.params;
		const words = text.split(' ');
    let line = '';
		const lines = [];
		const maxWidth = width - 2 * padding;
		const lineHeight = size + 8;
		
		words.forEach( function(word){
			const testLine = `${line}${word} `;
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
			if (testWidth > maxWidth) {
				lines.push(line);
				line = `${word} `;
			}else {
				line = testLine;
			}
		});
		
		if (line !== '') lines.push(line);
		
		let y = (height - lines.length * lineHeight) / 2;
		
		lines.forEach( function(line){
			ctx.fillText(line, 128, y);
			y += lineHeight;
		});
	}
}