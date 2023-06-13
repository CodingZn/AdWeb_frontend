export class Chat {
  public dom: HTMLElement;
  private input: HTMLElement;
  private btn: HTMLElement;
  private onSend: ((msg: string) => any) | null = null;

  constructor(onSend?: (msg: string) => any) {
    if (onSend) this.onSend = onSend;
    this.dom = document.createElement("div");
    this.dom.style.cssText = `
      position: fixed;
      display: flex;
      flex-direction: column;
      z-index: 9999;
      padding: 24px 24px 0;
      bottom: 0;
      left: 0;
      width: 640px;
      height: 320px;
      background: rgba(255, 255, 255, 0.2);
      -webkit-backdrop-filter: blur(8px);
      backdrop-filter: blur(8px);
      border-radius: 0 25px 25px 0;
      box-shadow: inset 0 0 6px rgba(255, 255, 255, 0.2);
    `;

    const chatContainer = document.createElement("div");
    chatContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      flex-basis: 90%;
      overflow: overlay;
    `
    const inputContainer = document.createElement("div");
    inputContainer.style.cssText = `
      display: flex;
      flex-basis: 10%;
    `
    const input = document.createElement("input");
    const inputCss = `
      flex-basis: 60%;
      flex: 1 1;
      outline-style: none;
      border: 1px solid #ccc;
      border-radius: 3px;
      padding: 13px 14px;
      font-size: 16px;
      font-weight: 700;
      font-family: "Microsoft soft";
    `;
    const inputHoverCss = `
      border-color: #66afe9;
      outline: 0;
      -webkit-box-shadow: inset 0 1px 1px rgba(0,0,0,.075),0 0 8px rgba(102,175,233,.6);
      box-shadow: inset 0 1px 1px rgba(0,0,0,.075),0 0 8px rgba(102,175,233,.6)`;
    input.style.cssText = inputCss;
    input.onkeyup = input.onkeydown = input.onmousedown = (e: Event) => e.stopPropagation();
    input.onmouseenter = () => input.style.cssText = inputCss + inputHoverCss
    input.onmouseleave = () => input.style.cssText = inputCss
    this.input = input;
    const sendCss = `
      color: #0099CC; 
      background: transparent; 
      border: 2px solid #0099CC;
      border-radius: 6px; 
      border: none;
      color: white;
      padding: 16px 32px;
      text-align: center;
      display: inline-block;
      font-size: 16px;
      margin: 4px 2px;
      -webkit-transition-duration: 0.4s; /* Safari */
      transition-duration: 0.4s;
      cursor: pointer;
      text-decoration: none;
      text-transform: uppercase;
      color: black; 
      border: 2px solid #008CBA;
    `;
    const sendHoverCss = `
      background-color: #008CBA;
      color: white;
    `;
    const btn = document.createElement("button");
    btn.innerHTML = 'Send'
    btn.style.cssText = sendCss;
    btn.onkeyup = btn.onkeydown = btn.onmousedown = (e: Event) => e.stopPropagation();
    btn.onmouseenter = () => btn.style.cssText = sendCss + sendHoverCss
    btn.onmouseleave = () => btn.style.cssText = sendCss;
    btn.onclick = () => this.send();
    this.btn = btn;
    inputContainer.appendChild(input);
    inputContainer.appendChild(btn);
    
    this.dom.appendChild(chatContainer);
    this.dom.appendChild(inputContainer);
  }

  public get value() {
    return (this.input as any).value;
  }

  public send() {
    this.onSend && this.onSend(this.value);
    (this.input as any).value = '';
  }
}