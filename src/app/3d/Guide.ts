import { Disposable } from "./utils/Disposable";

interface IOp {
  key: string;
  desc: string;
}

const common: IOp[] = [
  { key: 'wasd', desc: '移动' },
  { key: '点击', desc: '锁定鼠标' },
  { key: 'q', desc: '切换视角' },
  { key: 'c', desc: '打开/关闭聊天界面' },
  { key: '点击玩家', desc: '选择聊天对象' },
]

const sceneOps: { [key: string]: IOp[] } = {
  profile: [
    { key: 'a/←', desc: '上一个' },
    { key: 'd/→', desc: '下一个' },
    { key: 'enter', desc: '保存' }
  ],
  town: [
    ...common,
    { key: 'p', desc: '选择模型' },
    { key: 'l', desc: '去教室' },
  ],
  study: [
    ...common,
    { key: 'p', desc: '选择模型' }, 
    { key: 't', desc: '去城镇' },
    { key: 'i', desc: '概率分布' }
  ],
  distribution: [
    ...common,
    { key: 'p', desc: '选择模型' }, 
    { key: 'l', desc: '去教室' },
    { key: 'g', desc: '打开/关闭生成界面' },
  ]
}

export class Guide extends Disposable {
  private guide: HTMLElement;
  constructor(private container: HTMLElement) {
    super();
    const guide = document.createElement("div");
    guide.style.cssText = `
      position: fixed;
      bottom: 0;
      width: 100%;
      display: flex;
    `
    this.guide = guide;
    this._register({
      dispose: () => this.unmount()
    })
  }

  public mount(scene: string) {
    const ops = sceneOps[scene].slice();
    if (scene === 'profile') {
      ops.push({ key: 'esc', desc: '取消' });
    } else {
      ops.push({ key: 'esc', desc: '取消锁定/退出游戏' });
    }
    this.guide.innerHTML = ``
    ops.forEach(op => {
      const span = document.createElement("span");
      span.style.cssText = `margin-right: 20px; font-size: 20px;`
      span.innerHTML = `
        <span style="color: green; font-style: bold;">${op.key}</span>
        <span style="color: black;">${op.desc}</span>
      `
      this.guide.appendChild(span);
    })
    this.container.appendChild(this.guide);
    return this;
  }

  public unmount() {
    try {
      this.container.removeChild(this.guide);
    } catch (_) {}
    return this;
  }
}