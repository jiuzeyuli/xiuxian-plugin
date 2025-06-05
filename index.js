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
    this.app = app;
    this.cultivation = new Cultivation(app);
    let validRuleCount = 0;

    // 注册指令 - 添加安全检查和过滤
    this.cultivation.rule
      .filter((item) => item && item.reg && item.fnc) // 过滤无效条目
      .forEach((item) => {
        // 确保处理方法存在
        if (typeof this.cultivation[item.fnc] !== "function") {
          app.logger.error(`[修仙渡劫] 无效方法: ${item.fnc}`);
          return;
        }

        app.reg({
          reg: item.reg,
          fnc: item.fnc,
          event: "message",
          priority: this.cultivation.priority,
          log: true,
          handler: this.cultivation[item.fnc].bind(this.cultivation),
        });

        validRuleCount++;
      });

    // 注册新的事件监听器
    app.bot.on("message", async (e) => {
      if (e.msg === "#同意双修") {
        await this.cultivation.handleDualCultivationAgreement(e);
      }
    });

    app.logger.info(
      `[修仙渡劫] 插件加载完成，共注册 ${validRuleCount} 个有效指令`
    );

    // 打印无效规则数量用于调试
    const invalidCount = this.cultivation.rule.length - validRuleCount;
    if (invalidCount > 0) {
      app.logger.warn(`[修仙渡劫] 忽略 ${invalidCount} 个无效规则`);
    }
  }
}
