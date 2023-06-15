import {HttpClient, HttpHeaders, HttpParams, HttpXhrBackend} from "@angular/common/http";
import {Inject} from "@angular/core";
import {UserSessionService} from "../../user-session.service";

const http = new HttpClient(new HttpXhrBackend({
  build: () => new XMLHttpRequest()
}));
const baseUrl = "http://124.221.101.230:8080";
export class Gen {
  public dom: HTMLElement;
  private select_type: HTMLElement;
  private input_times: HTMLElement;
  private input_sigma: HTMLElement;
  private input_miu: HTMLElement;
  private btn: HTMLElement;
  onSend: any | null = null;
  private userService: UserSessionService;
  private data: any;


  constructor(onSend?: any) {
    this.userService = new UserSessionService(http);
    this.dom = document.createElement("div");

    this.dom.style.cssText = `
      position: fixed;
      display: flex;
      flex-direction: column;
      z-index: 9999;
      padding: 24px 24px 0;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 200px;
      background: rgba(255, 255, 255, 0.2);
      -webkit-backdrop-filter: blur(8px);
      backdrop-filter: blur(8px);
      border-radius: 0 25px 25px 0;
      box-shadow: inset 0 0 6px rgba(255, 255, 255, 0.2);
    `;

    const inputContainer = document.createElement("div");
    inputContainer.style.cssText = `
      max-width: 450px;
      display: flex;
      flex-basis: 10%;
    `
    const inputCss = `
      width: 50px;
      height: 50px;
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

    const option0 = document.createElement("option");
    option0.value = "0";
    option0.innerText = "正态分布";
    const option1 = document.createElement("option");
    option1.value = "1";
    option1.innerText = "均匀分布";
    const select_type = document.createElement("select");
    select_type.options.add(option0);
    select_type.options.add(option1);
    select_type.style.cssText = inputCss;
    this.select_type = select_type;

    const input_times = document.createElement("input");
    input_times.name = "times";
    input_times.type = "number";
    input_times.placeholder = "times";
    input_times.style.cssText = inputCss;
    const input_sigma = document.createElement("input");
    input_sigma.name = "sigma";
    input_sigma.type = "number";
    input_sigma.placeholder = "sigma";
    input_sigma.style.cssText = inputCss;
    const input_miu = document.createElement("input");
    input_miu.name = "miu";
    input_miu.type = "number";
    input_miu.placeholder = "miu";
    input_miu.style.cssText = inputCss;

    this.input_times = input_times;
    this.input_sigma = input_sigma;
    this.input_miu = input_miu;

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
    inputContainer.appendChild(select_type);
    inputContainer.appendChild(input_times);
    inputContainer.appendChild(input_sigma);
    inputContainer.appendChild(input_miu);
    inputContainer.appendChild(btn);
    //
    // this.dom.appendChild(chatContainer);
    const readme = document.createElement("p");
    readme.innerText = `欢迎使用随机分布产生器，其一分钟内只能产生一次，机会在0秒时刷新。`;
    this.dom.appendChild(readme);

    const time = document.createElement("p");
    time.innerText = new Date().toTimeString();

    setInterval(()=>{
      let now = new Date()
      this.dom.removeChild(time);
      time.innerText = now.toTimeString();
      if(now.getSeconds()==0){
        time.style.color = "red";
      }else{
        time.style.color = "black";
      }
      this.dom.appendChild(time);
      }, 1000)
    this.dom.appendChild(inputContainer);
    this.dom.appendChild(time);
  }

  public get value() {
    return this.data;
  }

  public send() {
    let type = (this.select_type as any).value;
    let times = (this.input_times as any).value;
    let miu = (this.input_miu as any).value;
    let sigma = (this.input_sigma as any).value

    let url = baseUrl;
    let params = new HttpParams().set("times", times).set("miu", miu).set("sigma", sigma);

    console.log(type);
    console.log(params);
    if (type=="0"){
      url += "/distribution/normalXY";
      http.get(url, {params: params}).subscribe(
        data=>{
          console.log(data);
          this.onSend(data);
        },
        error => {
          if (error.status == 400){
            window.alert("请输入正确的参数！")
          }
          else
            window.alert("请一分钟后再试！")
        }
      );
    }
    else{
      url += "/distribution/uniformXY";
      http.get(url, {params: params}).subscribe(
        data=>{
          console.log(data);
          this.onSend(data);
        },
        error => {
          if (error.status == 400){
            window.alert("请输入正确的参数！")
          }
          else
            window.alert("请一分钟后再试！")
        }
      );
    }
  }
}
