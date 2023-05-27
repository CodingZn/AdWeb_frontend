export interface IJoyStickOption {
  onMove?: (forward: number, turn: number) => void,
  container?: HTMLElement,
  maxRadius?: number,
  moveDamping?: number
  rotationDamping?: number
}

export class JoyStick {
  private domElement: HTMLElement;
  private circle: HTMLElement;
  private container: HTMLElement;
  private maxRadius: number;
  private maxRadiusSquared: number;
  private onMove: ((forward: number, turn: number) => void) | undefined;
  private rotationDamping: number;
  private moveDamping: number;
  private origin: { left: number, top: number } = { left: 0, top: 0 };
  private offset: { x: number, y: number } = { x: 0, y: 0 };

	constructor(options: IJoyStickOption){
		const circle = document.createElement("div");
		circle.style.cssText = "position: absolute; bottom:35px; width:80px; height:80px; background:rgba(126, 126, 126, 0.5); border:#444 solid medium; border-radius:50%; left:50%; transform:translateX(-50%);";
		const thumb = document.createElement("div");
		thumb.style.cssText = "position: absolute; left: 20px; top: 20px; width: 40px; height: 40px; border-radius: 50%; background: #fff;";
		circle.appendChild(thumb);
		this.circle = circle;
		this.container = options.container || document.body;
		this.domElement = thumb;
		this.maxRadius = options.maxRadius || 40;
		this.maxRadiusSquared = this.maxRadius * this.maxRadius;
		this.onMove = options.onMove;
		this.rotationDamping = options.rotationDamping || 0.06;
		this.moveDamping = options.moveDamping || 0.01;
		if (this.domElement !== undefined){
			const joystick = this;
			if ('ontouchstart' in window) {
				this.domElement.addEventListener('touchstart', function(evt){ evt.preventDefault(); joystick.tap(evt); evt.stopPropagation();});
			} else {
				this.domElement.addEventListener('mousedown', function(evt){ evt.preventDefault(); joystick.tap(evt); evt.stopPropagation();});
			}
		}
	}
	
	public mount() {
		this.container.appendChild(this.circle);
		this.origin = { left: this.domElement.offsetLeft, top: this.domElement.offsetTop };
	}

	public unmount() {
		this.container.removeChild(this.circle);
	}

	private getMousePosition(evt: Event){
    const touchEvt = evt as TouchEvent;
    const mouseEvt = evt as MouseEvent;
		let clientX = touchEvt.targetTouches ? touchEvt.targetTouches[0].pageX : mouseEvt.clientX;
		let clientY = touchEvt.targetTouches ? touchEvt.targetTouches[0].pageY : mouseEvt.clientY;
		return { x: clientX, y: clientY };
	}
	
	private tap(evt: any){
		evt = evt || window.event;
		// get the mouse cursor position at startup:
		this.offset = this.getMousePosition(evt);
		const joystick = this;
		if ('ontouchstart' in window){
			document.ontouchmove = function(evt){ evt.preventDefault(); joystick.move(evt); };
			document.ontouchend =  function(evt){ evt.preventDefault(); joystick.up(evt); };
		} else {
			document.onmousemove = function(evt){ evt.preventDefault(); joystick.move(evt); };
			document.onmouseup = function(evt){ evt.preventDefault(); joystick.up(evt); };
		}
	}
	
	private move(evt: Event){
		evt = evt || window.event;
		const mouse = this.getMousePosition(evt);
		// calculate the new cursor position:
		let left = mouse.x - this.offset.x;
		let top = mouse.y - this.offset.y;
		//this.offset = mouse;
		
		const sqMag = left * left + top * top;
		if (sqMag > this.maxRadiusSquared) {
			//Only use sqrt if essential
			const magnitude = Math.sqrt(sqMag);
			left /= magnitude;
			top /= magnitude;
			left *= this.maxRadius;
			top *= this.maxRadius;
		}
		// set the element's new position:
		this.domElement.style.top = `${top + this.domElement.clientHeight / 2}px`;
		this.domElement.style.left = `${left + this.domElement.clientWidth / 2}px`;
		
		const forward = -(top - this.origin.top + this.domElement.clientHeight / 2) / this.maxRadius;
		const turn = (left - this.origin.left + this.domElement.clientWidth / 2) / this.maxRadius;
		
		if (this.onMove !== undefined) this.onMove(forward, turn);
	}
	
	private up(evt: Event){
		if ('ontouchstart' in window) {
			document.ontouchmove = null;
			(document as any).touchend = null;
		} else {
			document.onmousemove = null;
			document.onmouseup = null;
		}
		this.domElement.style.top = `${this.origin.top}px`;
		this.domElement.style.left = `${this.origin.left}px`;
		
		if (this.onMove !== undefined) this.onMove(0, 0);
	}
}
