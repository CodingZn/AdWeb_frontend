import { Player } from "../characters/Player";
import { ForwardMessageParams } from "../socket/model";
import { Disposable } from "../utils/Disposable";

export interface IMessage {
  sender: Player;
  receiver?: Player;
  message: string;
}

export class Chat extends Disposable {
  public dom: HTMLElement;
  private input: HTMLElement;
  private btn: HTMLElement;
  private chatContainer: HTMLElement;
  private target: HTMLElement;
  private onSend: ((message: string, receiver?: Player) => any) | null = null;
  private receiver: Player | undefined; 

  public get mounted() { return this.dom.parentElement !== null; }

  public mount(el: HTMLElement = document.body) { if (!this.mounted) el.appendChild(this.dom); }
  public unmount() { this.mounted && this.dom.parentElement!.removeChild(this.dom); }

  constructor(onSend?: (msg: string) => any) {
    super();
    if (onSend) this.onSend = onSend;
    this.dom = document.createElement("div");
    this.dom.style.cssText = `
      position: fixed;
      display: flex;
      flex-direction: column;
      z-index: 9999;
      padding: 24px 24px 0 0;
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
      paddingLeft: 24px; 
    `
    this.chatContainer = chatContainer;
    const inputContainer = document.createElement("div");
    inputContainer.style.cssText = `
      display: flex;
      flex-basis: 10%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: 0x1E90FF;
      font-style: italic;
    `
    const target = document.createElement("div");
    target.innerHTML = 'To All';
    target.style.cssText = `
      padding: 13px 14px;
      font-size: 16px;
      font-weight: 700;
    `;
    this.target = target;
    const input = document.createElement("input");
    const inputCss = `
      flex-basis: 60%;
      flex: 1 1;
      outline-style: none;
      border: 1px solid #ccc;
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
      border: none;
      color: white;
      padding: 16px 32px;
      text-align: center;
      display: inline-block;
      font-size: 16px;
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
    inputContainer.appendChild(target);
    inputContainer.appendChild(input);
    inputContainer.appendChild(btn);
    
    this.dom.appendChild(chatContainer);
    this.dom.appendChild(inputContainer);

    this._register({
      dispose: () => {
        if (this.dom.parentElement) {
          this.dom.parentElement.removeChild(this.dom);
        }
      }
    })
  }

  public set to(v: Player | undefined) {
    if (v === undefined) {
      this.target.innerHTML = `to All`;
    } else {
      this.target.innerHTML = `to ${v.name}`;
    }
    this.receiver = v;
  }

  public get value() {
    return (this.input as any).value;
  }

  public send() {
    this.onSend && this.onSend(this.value, this.receiver);
    (this.input as any).value = '';
  }

  public onReceive(msgObj: IMessage, sendBySelf: boolean = false, sendToSelf: boolean = false) {
    const { message, sender, receiver } = msgObj;
    const msgContainer = document.createElement("div");
    msgContainer.style.cssText = `
      display: flex;
    `;
    const left = document.createElement("div");
    left.style.cssText = `
      width: 300px;
    `;
    const d = new Date();
    left.innerHTML = `
      <span style="color: #0; marginRight: 10px">${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}</span>
      <span style="color: ${sendBySelf ? '#00ff00' : '#1e90ff'}">${sender.name}</span>
      <span style="color: #0">to</span>
      <span style="color: ${receiver?.name ? sendToSelf ? '#00ff00' : '#1e90ff' : '#ff0000' }">${receiver?.name || 'All'}</span>
    `;
    const msg = document.createElement("div");
    msg.style.cssText = `
      flex: 1;
    `;
    msg.innerHTML = message;
    msgContainer.appendChild(left);
    msgContainer.appendChild(msg);
    this.chatContainer.appendChild(msgContainer);
  }
}