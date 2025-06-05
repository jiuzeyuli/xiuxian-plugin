import fs from "fs";
import path from "path";

export default class DataModel {
  constructor(fileName) {
    this.filePath = path.join(process.cwd(), "data", "xiuxian", fileName);
    this.data = this.load();
  }

  // 加载数据
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

  // 保存数据
  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error(`[修仙渡劫] 数据保存失败: ${this.filePath}`, err);
    }
  }

  // 获取数据
  get(key) {
    return this.data[key];
  }

  // 设置数据
  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  // 检查是否存在
  has(key) {
    return this.data.hasOwnProperty(key);
  }

  // 删除数据
  delete(key) {
    if (this.has(key)) {
      delete this.data[key];
      this.save();
    }
  }

  // 获取所有数据
  getAll() {
    return this.data;
  }
}
