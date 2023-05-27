export interface IPreloaderOption {
  assets: string[];
  container: HTMLElement,
  onComplete: () => void,
  onProgress?: (percent: number) => void,
}

export class Preloader{
  private assets: { [key: string]: { loaded: number, complete: boolean, total?: number } };
  private container: HTMLElement;
  private domElement: HTMLElement = document.body;
  private progressBar: HTMLElement | null = null;
  private onProgress: (percent: number) => void;
  private onComplete: () => void;

	constructor(options: IPreloaderOption){
    const { assets, container, onProgress, onComplete } = options;
    this.container = container;
		this.assets = {};
		for(let asset of assets){
			this.assets[asset] = { loaded: 0, complete: false };
			this.load(asset);
		}
		
		if (onProgress === undefined) {
			this.onProgress = function (delta){
        if (this.progressBar) {
          const progress = delta * 100;
          this.progressBar.style.width = `${progress}%`;
        }
      };
			this.domElement = document.createElement("div");
			this.domElement.style.position = 'absolute';
			this.domElement.style.top = '0';
			this.domElement.style.left = '0';
			this.domElement.style.width = '100%';
			this.domElement.style.height = '100%';
			this.domElement.style.background = '#000';
			this.domElement.style.opacity = '0.7';
			this.domElement.style.display = 'flex';
			this.domElement.style.alignItems = 'center';
			this.domElement.style.justifyContent = 'center';
			this.domElement.style.zIndex = '1111';
			const barBase = document.createElement("div");
			barBase.style.background = '#aaa';
			barBase.style.width = '50%';
			barBase.style.minWidth = '250px';
			barBase.style.borderRadius = '10px';
			barBase.style.height = '15px';
			this.domElement.appendChild(barBase);
			const bar = document.createElement("div");
			bar.style.background = '#2a2';
			bar.style.width = '50%';
			bar.style.borderRadius = '10px';
			bar.style.height = '100%';
			bar.style.width = '0';
			barBase.appendChild(bar);
			this.progressBar = bar;
			this.container.appendChild(this.domElement);
		} else {
			this.onProgress = onProgress;
		}
		this.onComplete = onComplete;	
	}
	
	checkCompleted(){
		for(let prop in this.assets){
			const asset = this.assets[prop];
			if (!asset.complete) return false;
		}
		return true;
	}
	
	get progress() {
		let total = 0;
		let loaded = 0;
		
		for(let prop in this.assets){
			const asset = this.assets[prop];
			if (asset.total == undefined){
				loaded = 0;
				break;
			}
			loaded += asset.loaded; 
			total += asset.total;
		}
		
		return loaded / total;
	}
	
	load(url: string){
		const loader = this;
		const xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
		xobj.open('GET', url, true); 
		xobj.onreadystatechange = function () {
			if (xobj.readyState === 4 && xobj.status === 200) {
			  loader.assets[url].complete = true;
			  if (loader.checkCompleted()){
          loader.container.removeChild(loader.domElement);
				  loader.onComplete();
			  }
			}
		};
		xobj.onprogress = function(e){
			const asset = loader.assets[url];
			asset.loaded = e.loaded;
			asset.total = e.total;
			loader.onProgress(loader.progress);
		}
		xobj.send(null);
	}
}