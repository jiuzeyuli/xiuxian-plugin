// xiuxian-plugin/index.js
const path = require("path");
const fs = require("fs");
const Cultivation = require("./apps/cultivation");

// 确保数据目录存在
const dataPath = path.join(process.cwd(), "data", "xiuxian");
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// 插件初始化
module.exports = {
  name: "修仙渡劫",
  dsc: "修仙渡劫系统",
  version: "1.5.0",
  author: "修仙插件开发组",
  priority: 9999,

  init: async function (bot) {
    this.cultivation = new Cultivation(bot);

    // 注册指令
    this.cultivation.rule.forEach((item) => {
      bot.reg({
        reg: item.reg,
        fnc: item.fnc,
        event: "message",
        priority: this.priority,
        log: true,
      });
    });

    // 注册新的事件监听器
    bot.on("message", async (e) => {
      if (e.msg === "#同意双修") {
        await this.cultivation.handleDualCultivationAgreement(e);
      }
    });

    logger.info(
      `[修仙渡劫] 插件加载完成，共注册 ${this.cultivation.rule.length} 个指令`
    );
  },
};
