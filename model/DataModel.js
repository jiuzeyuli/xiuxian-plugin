// xiuxian-plugin/model/DataModel.js
const fs = require("fs");
const path = require("path");

class DataModel {
  constructor(fileName) {
    this.filePath = path.join(process.cwd(), "data", "xiuxian", fileName);
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, "utf8"));
      }
      return {};
    } catch (err) {
      console.error(`[修仙渡劫] 数据加载失败: ${this.filePath}`, err);
      return {};
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error(`[修仙渡劫] 数据保存失败: ${this.filePath}`, err);
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  has(key) {
    return this.data.hasOwnProperty(key);
  }

  delete(key) {
    if (this.has(key)) {
      delete this.data[key];
      this.save();
    }
  }

  getAll() {
    return this.data;
  }
}

module.exports = DataModel;
