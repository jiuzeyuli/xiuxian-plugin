export default class CooldownManager {
  constructor() {
    this.cooldowns = new Map();
    this.dualCultivationRequests = new Map();
  }

  // 设置冷却时间
  setCooldown(userId, command, duration) {
    const key = `${userId}:${command}`;
    const expires = Date.now() + duration;
    this.cooldowns.set(key, expires);

    // 设置超时自动清除
    setTimeout(() => {
      if (this.cooldowns.get(key) === expires) {
        this.cooldowns.delete(key);
      }
    }, duration);
  }

  // 获取剩余冷却时间
  getCooldown(userId, command) {
    const key = `${userId}:${command}`;
    const expires = this.cooldowns.get(key);
    if (!expires) return 0;

    const remaining = expires - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  // 添加双修请求
  addDualCultivationRequest(requesterId, targetId) {
    const key = `${targetId}:dualCultivation`;
    this.dualCultivationRequests.set(key, {
      requesterId,
      expires: Date.now() + 120000, // 2分钟有效期
    });

    // 设置超时自动清除
    setTimeout(() => {
      if (this.dualCultivationRequests.get(key)?.expires < Date.now()) {
        this.dualCultivationRequests.delete(key);
      }
    }, 120000);
  }

  // 获取双修请求
  getDualCultivationRequest(targetId) {
    const key = `${targetId}:dualCultivation`;
    const request = this.dualCultivationRequests.get(key);
    if (!request) return null;

    if (request.expires < Date.now()) {
      this.dualCultivationRequests.delete(key);
      return null;
    }

    return request;
  }

  // 移除双修请求
  removeDualCultivationRequest(targetId) {
    const key = `${targetId}:dualCultivation`;
    this.dualCultivationRequests.delete(key);
  }
}
