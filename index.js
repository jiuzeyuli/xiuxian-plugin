import path from "path";
import fs from "fs";
import Cultivation from "./apps/cultivation.js";

// 确保数据目录存在
const dataPath = path.join(process.cwd(), "data", "xiuxian");
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// 插件初始化
export default class XiuxianPlugin {
  constructor() {
    this.id = "xiuxian";
    this.name = "修仙渡劫";
    this._path = import.meta.url;
  }

  async init(app) {
    this.cultivation = new Cultivation(app);

    // 注册指令
    this.cultivation.rule.forEach((item) => {
      app.reg({
        reg: item.reg,
        fnc: item.fnc,
        event: "message",
        priority: this.cultivation.priority,
        log: true,
        handler: this.cultivation[item.fnc].bind(this.cultivation),
      });
    });

    // 注册新的事件监听器
    app.bot.on("message", async (e) => {
      if (e.msg === "#同意双修") {
        await this.cultivation.handleDualCultivationAgreement(e);
      }
    });

    app.logger.info(
      `[修仙渡劫] 插件加载完成，共注册 ${this.cultivation.rule.length} 个指令`
    );
  }
}
