import schedule from 'node-schedule';
import DataModel from '../model/DataModel.js';
import CooldownManager from '../model/CooldownManager.js';

// 导入数据
import realms from '../resources/data/realms.js';
import spiritRoots from '../resources/data/spiritRoots.js';
import pills from '../resources/data/pills.js';
import arts from '../resources/data/arts.js';
import artifacts from '../resources/data/artifacts.js';
import dungeons from '../resources/data/dungeons.js';
import tribulations from '../resources/data/tribulations.js';
import shopItems from '../resources/data/shopItems.js';

export default class Cultivation {
  constructor(app) {
    this.app = app;
    this.cooldown = new CooldownManager();
    this.priority = 9999;
    
    // 冷却时间设置
    this.cdTimes = {
      cultivate: 3 * 60 * 1000,       // 3分钟
      seclusion: 30 * 60 * 1000,      // 30分钟
      adventure: 10 * 60 * 1000,      // 10分钟
      dungeon: 5 * 60 * 1000,         // 5分钟
      breakthrough: 2 * 60 * 1000,    // 2分钟
      alchemy: 1 * 60 * 1000,         // 1分钟
      comprehendArt: 2 * 60 * 1000,   // 2分钟
      dualCultivation: 5 * 60 * 1000  // 5分钟
    };
    
    // 系统数据
    this.realms = realms;
    this.spiritRoots = spiritRoots;
    this.pills = pills;
    this.arts = arts;
    this.artifacts = artifacts;
    this.dungeons = dungeons;
    this.tribulationTypes = tribulations;
    this.shopItems = shopItems;
    
    // 背包物品
    this.backpackItems = [
      { id: 101, name: "低级妖丹", type: "material", desc: "炼气期妖兽内丹", value: 50 },
      { id: 102, name: "百年人参", type: "material", desc: "炼制丹药的材料", value: 100 },
      { id: 103, name: "玄铁", type: "material", desc: "炼制法宝的材料", value: 200 },
      { id: 104, name: "下品灵石袋", type: "currency", desc: "内含100下品灵石", value: 100 },
      { id: 105, name: "秘境地图", type: "special", desc: "随机秘境的地图", value: 500 }
    ];
    
    // 初始化数据模型
    this.userData = new DataModel('user_data.json');
    this.sectData = new DataModel('sect_data.json');
    
    // 指令规则
    this.rule = [
      { reg: '^#修仙帮助$', fnc: 'cultivationHelp' },
      { reg: '^#我的境界$', fnc: 'checkCultivation' },
      { reg: '^#修炼$', fnc: 'cultivate' },
      { reg: '^#突破$', fnc: 'breakthrough' },
      { reg: '^#闭关\\s*(\\d+)?\\s*(天|时辰)?$', fnc: 'seclusion' },
      { reg: '^#渡劫$', fnc: 'tribulation' },
      { reg: '^#灵根测试$', fnc: 'spiritRootTest' },
      { reg: '^#丹药$', fnc: 'viewPills' },
      { reg: '^#炼丹\\s+(\\d+)$', fnc: 'alchemy' },
      { reg: '^#服用丹药\\s+(\\d+)$', fnc: 'takePill' },
      { reg: '^#修仙排行榜$', fnc: 'cultivationRank' },
      { reg: '^#领悟功法$', fnc: 'comprehendArt' },
      { reg: '^#奇遇$', fnc: 'adventure' },
      { reg: '^#渡劫准备$', fnc: 'tribulationPreparation' },
      { reg: '^#挑战秘境\\s*(\\d+)?$', fnc: 'challengeDungeon' },
      { reg: '^#双修\\s*@?(\\d+)?$', fnc: 'dualCultivation' },
      { reg: '^#炼制法宝\\s*(\\d+)?$', fnc: 'forgeArtifact' },
      { reg: '^#装备法宝\\s*(\\d+)?$', fnc: 'equipArtifact' },
      { reg: '^#宗门$', fnc: 'sectInfo' },
      { reg: '^#加入宗门\\s*(\\S+)$', fnc: 'joinSect' },
      { reg: '^#创建宗门\\s*(\\S+)$', fnc: 'createSect' },
      { reg: '^#每日签到$', fnc: 'dailySign' },
      { reg: '^#宗门任务$', fnc: 'sectMission' },
      { reg: '^#修仙日志$', fnc: 'cultivationLog' },
      { reg: '^#背包$', fnc: 'viewBackpack' },
      { reg: '^#商店$', fnc: 'viewShop' },
      { reg: '^#购买\\s+(\\d+)\\s*(\\d+)?$', fnc: 'buyItem' },
      { reg: '^#出售\\s+(\\d+)\\s*(\\d+)?$', fnc: 'sellItem' },
      { reg: '^#查看法宝$', fnc: 'viewArtifactsSystem' },
      { reg: '^#查看丹药$', fnc: 'viewPillsSystem' },
      { reg: '^#查看功法$', fnc: 'viewArtsSystem' },
      { reg: '^#查看灵根$', fnc: 'viewSpiritRootsSystem' },
      { reg: '^#查看天劫$', fnc: 'viewTribulationSystem' },
      { reg: '^#宗门列表$', fnc: 'viewSectsList' },
      { reg: '^#境界体系$', fnc: 'viewRealmsSystem' }
    ];
    
    // 定时任务
    schedule.scheduleJob('0 0 0 * * *', () => this.dailyReset());
    schedule.scheduleJob('0 0 0 * * 1', () => this.weeklySectBenefits());
    
    // 初始化随机事件
    this.initRandomEvents();
  }
  
  /** 初始化随机事件 */
  initRandomEvents() {
    this.randomEvents = {
      cultivate: [
        { 
          chance: 0.15, 
          message: "✨ 你在修炼时感应到天地灵气异常活跃，吸收效率大增！",
          effect: (user) => {
            user.exp += Math.floor(user.exp * 0.3);
            return `修为额外增加30%！`;
          }
        },
        { 
          chance: 0.05, 
          message: "💫 突然顿悟！对功法有了新的理解！",
          effect: (user) => {
            user.comprehension += 0.2;
            return `悟性+0.2！`;
          }
        },
        { 
          chance: 0.08, 
          message: "🌧️ 修炼时遭遇灵气逆流，经脉受损！",
          effect: (user) => {
            const damage = Math.floor(Math.random() * 10) + 5;
            user.life -= damage;
            return `生命值-${damage}！`;
          }
        }
      ],
      breakthrough: [
        { 
          chance: 0.1, 
          message: "🌟 突破时引发天地异象，境界更加稳固！",
          effect: (user) => {
            user.daoHeart += 0.3;
            return `道心+0.3！`;
          }
        },
        { 
          chance: 0.07, 
          message: "💥 突破时意外发现体内潜能，战斗力大幅提升！",
          effect: (user) => {
            user.combatPower += 20;
            return `战斗力+20！`;
          }
        }
      ],
      adventure: [
        { 
          chance: 0.12, 
          message: "🌄 探索中发现一处灵泉，沐浴后身心舒畅！",
          effect: (user) => {
            user.life += 15;
            user.luck += 10;
            return `生命值+15，气运+10！`;
          }
        },
        { 
          chance: 0.05, 
          message: "🏔️ 偶遇隐世高人，得到指点！",
          effect: (user) => {
            user.exp += Math.floor(user.maxExp * 0.1);
            return `修为增加当前境界10%！`;
          }
        }
      ]
    };
  }
  
  /** 触发随机事件 */
  triggerRandomEvent(type, user) {
    const events = this.randomEvents[type];
    if (!events) return null;
    
    const randomValue = Math.random();
    let cumulativeChance = 0;
    
    for (const event of events) {
      cumulativeChance += event.chance;
      if (randomValue <= cumulativeChance) {
        const effectResult = event.effect(user);
        return {
          message: event.message,
          effect: effectResult
        };
      }
    }
    
    return null;
  }
  
  /** 获取用户修仙数据 */
  getUserData(userId) {
    if (!this.userData.has(userId)) {
      const user = {
        realm: 0,          // 当前境界
        exp: 0,            // 当前修为
        maxExp: 100,       // 当前境界最大修为
        spiritRoot: 0,     // 灵根资质
        pills: {},         // 丹药库存
        arts: [1],         // 已领悟功法ID
        artifacts: [],     // 拥有的法宝
        equippedArtifact: null, // 装备的法宝
        lastCultivate: 0,  // 上次修炼时间
        lastSeclusion: 0,  // 上次闭关时间
        lastDungeon: 0,    // 上次挑战秘境时间
        life: 100,         // 生命值
        tribulationCount: 0,// 渡劫次数
        successCount: 0,   // 成功次数
        stone: 100,        // 灵石
        luck: 50,          // 气运值
        lastAdventure: 0,  // 上次奇遇时间
        sect: null,        // 所属宗门
        title: "外门弟子",  // 宗门称号
        contribution: 0,   // 宗门贡献
        comprehension: 1,  // 悟性
        daoHeart: 1,       // 道心
        combatPower: 5,    // 战斗力
        signDays: 0,       // 连续签到天数
        lastSign: 0,       // 上次签到时间
        achievements: [],  // 成就
        logs: [],           // 修仙日志
        backpack: {         // 背包系统
          items: {},
          capacity: 20
        }
      };
      this.userData.set(userId, user);
    }
    return this.userData.get(userId);
  }
  
  /** 更新用户数据 */
  updateUserData(userId, data) {
    this.userData.set(userId, data);
  }
  
  /** 添加日志 */
  addLog(userId, log) {
    const user = this.getUserData(userId);
    user.logs.push({
      time: new Date().toISOString(),
      content: log
    });
    
    // 只保留最近20条日志
    if (user.logs.length > 20) {
      user.logs.shift();
    }
    
    this.updateUserData(userId, user);
  }
  
  /** 每日重置 */
  dailyReset() {
    const allUsers = this.userData.getAll();
    Object.keys(allUsers).forEach(userId => {
      const user = allUsers[userId];
      user.luck = Math.min(100, user.luck + 10);
      user.life = Math.min(100, user.life + 20);
      
      // 宗门每日福利
      if (user.sect) {
        const sect = this.sectData.get(user.sect);
        if (sect) {
          user.stone += sect.level * 50;
          user.contribution += 10;
        }
      }
    });
    this.userData.data = allUsers;
    this.userData.save();
  }
  
  /** 每周宗门福利 */
  weeklySectBenefits() {
    const allSects = this.sectData.getAll();
    Object.keys(allSects).forEach(sectId => {
      const sect = allSects[sectId];
      sect.funds += sect.members.length * 100 * sect.level;
    });
    this.sectData.data = allSects;
    this.sectData.save();
  }

  /** 帮助信息 */
  async cultivationHelp(e) {
    const helpMsg = [
      '🌌 修仙渡劫系统·终极版',
      '================================',
      '🏮 基础指令：',
      '#每日签到 - 每日签到获取灵石奖励',
      '#修炼 - 日常修炼增加修为 (冷却3分钟)',
      '#突破 - 尝试突破到下一境界 (冷却2分钟)',
      '#渡劫 - 境界圆满后渡劫飞升',
      '#我的境界 - 查看当前修仙状态',
      '#灵根测试 - 检测自身灵根资质',
      '',
      '🔮 进阶指令：',
      '#闭关 [时间] - 长时间闭关修炼 (冷却30分钟)',
      '#丹药 - 查看可炼制的丹药',
      '#炼丹 [丹药ID] - 炼制丹药 (冷却1分钟)',
      '#服用丹药 [丹药ID] - 使用丹药',
      '#领悟功法 - 尝试领悟新功法 (冷却2分钟)',
      '#奇遇 - 探索修仙界奇遇 (冷却10分钟)',
      '#修仙排行榜 - 查看修仙排行榜',
      '#渡劫准备 - 查看渡劫准备情况',
      '#挑战秘境 [层级] - 挑战秘境获取资源 (冷却5分钟)',
      '',
      '⚔️ 战斗系统：',
      '#炼制法宝 [ID] - 炼制法宝增强实力',
      '#装备法宝 [ID] - 装备法宝获得加成',
      '',
      '👥 社交系统：',
      '#双修 [@对方] - 邀请道友双修 (冷却5分钟)',
      '#宗门 - 查看宗门信息',
      '#加入宗门 [名称] - 加入宗门',
      '#创建宗门 [名称] - 创建新宗门',
      '#宗门任务 - 完成宗门任务获取贡献',
      '',
      '🎒 背包商店：',
      '#背包 - 查看背包内容',
      '#商店 - 查看修仙商店',
      '#购买 [ID] [数量] - 购买物品',
      '#出售 [ID] [数量] - 出售物品',
      '',
      '📚 系统查看：',
      '#查看法宝 - 查看法宝系统',
      '#查看丹药 - 查看丹药系统',
      '#查看功法 - 查看功法系统',
      '#查看灵根 - 查看灵根系统',
      '#查看天劫 - 查看天劫系统',
      '#宗门列表 - 查看现有宗门',
      '#境界体系 - 查看修仙境界体系',
      '',
      '📜 其他指令：',
      '#修仙日志 - 查看最近的修仙历程',
      '================================',
      '💡 提示：输入具体指令查看详细信息'
    ].join('\n');
    await e.reply(helpMsg);
  }
  
  /** 每日签到 */
  async dailySign(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 检查是否已签到
    if (user.lastSign >= today.getTime()) {
      return e.reply("✅ 今日已签到，请明日再来！");
    }
    
    // 计算连续签到天数
    const lastSignDate = new Date(user.lastSign);
    lastSignDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastSignDate) / (24 * 3600 * 1000));
    
    if (daysDiff === 1) {
      user.signDays++;
    } else if (daysDiff > 1) {
      user.signDays = 1; // 中断连续签到
    } else {
      user.signDays = user.signDays || 1;
    }
    
    // 基础奖励
    let stoneReward = 100 + user.signDays * 50;
    let expReward = 50 + user.signDays * 20;
    
    // 额外奖励（每连续7天）
    let extraMsg = '';
    if (user.signDays % 7 === 0) {
      const bonus = Math.floor(user.signDays / 7) * 500;
      stoneReward += bonus;
      expReward += bonus;
      extraMsg = `✨ 连续签到满${user.signDays}天，额外奖励灵石+${bonus}，修为+${bonus}！`;
      
      // 成就系统
      if (!user.achievements.includes('7day_sign')) {
        user.achievements.push('7day_sign');
        extraMsg += `\n🎉 获得成就【七日之约】！`;
      }
    }
    
    // 宗门加成
    if (user.sect) {
      const sect = this.sectData.get(user.sect);
      if (sect) {
        const sectBonus = sect.level * 50;
        stoneReward += sectBonus;
        extraMsg += `\n🏯 宗门加成：灵石+${sectBonus}`;
      }
    }
    
    // 更新用户数据
    user.stone += stoneReward;
    user.exp += expReward;
    user.lastSign = now;
    user.luck = Math.min(100, user.luck + 5);
    
    this.updateUserData(userId, user);
    
    // 添加日志
    this.addLog(userId, `签到成功，获得灵石${stoneReward}，修为${expReward}`);
    
    await e.reply([
      `📅 签到成功！连续签到 ${user.signDays} 天`,
      `💎 获得灵石：${stoneReward}`,
      `✨ 获得修为：${expReward}`,
      `🍀 气运 +5`,
      extraMsg
    ].join('\n'));
  }
  
  /** 查看境界 */
  async checkCultivation(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    const realm = this.realms[user.realm];
    const nextRealm = user.realm < this.realms.length - 1 ? this.realms[user.realm + 1] : null;
    
    // 计算属性加成
    const spiritRoot = this.spiritRoots[user.spiritRoot];
    const expRate = spiritRoot.expRate * (1 + user.comprehension * 0.1);
    
    const msg = [
      `🧘 道号：${e.sender.card || e.sender.nickname}`,
      `🌠 境界：${realm.name}（${user.exp}/${realm.maxExp}）`,
      `✨ 灵根：${spiritRoot.name}（修为效率×${expRate.toFixed(1)}）`,
      `❤️ 生命：${user.life}/100`,
      `🍀 气运：${user.luck}/100`,
      `💎 灵石：${user.stone}`,
      `📜 功法：${user.arts.map(id => this.arts.find(a => a.id === id)?.name || '未知'}`,
      `⚔️ 战斗力：${user.combatPower}`,
      `⚡ 渡劫：${user.successCount}成功/${user.tribulationCount}次`,
    ];
    
    if (nextRealm) {
      msg.push(`⬆️ 下一境界：${nextRealm.name}（需 ${nextRealm.exp} 修为）`);
    } else {
      msg.push(`✅ 已达最高境界`);
    }
    
    // 显示装备的法宝
    if (user.equippedArtifact) {
      const artifact = this.artifacts.find(a => a.id === user.equippedArtifact);
      if (artifact) {
        msg.push(`🔮 法宝：${artifact.name}（${artifact.effect}）`);
      }
    }
    
    // 显示宗门信息
    if (user.sect) {
      const sect = this.sectData.get(user.sect);
      if (sect) {
        msg.push(`🏯 宗门：${sect.name}（${user.title}）`);
        msg.push(`🎖️ 贡献：${user.contribution}`);
      }
    }
    
    // 显示签到信息
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (user.lastSign < today.getTime()) {
      msg.push(`📅 今日未签到，使用 #每日签到 领取奖励`);
    } else {
      msg.push(`📅 已连续签到 ${user.signDays} 天`);
    }
    
    // 显示冷却时间
    const cultivateCd = this.cooldown.getCooldown(userId, 'cultivate');
    if (cultivateCd > 0) {
      msg.push(`⏳ 修炼冷却：${Math.ceil(cultivateCd / 60000)}分钟`);
    } else {
      msg.push(`✅ 修炼可进行`);
    }
    
    await e.reply(msg.join('\n'));
  }
  
  /** 日常修炼 */
  async cultivate(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    const now = Date.now();
    
    // 检查修炼CD
    const cd = this.cooldown.getCooldown(userId, 'cultivate');
    if (cd > 0) {
      const minutes = Math.ceil(cd / 60000);
      return e.reply(`🕒 修炼需调息，请${minutes}分钟后再试`);
    }
    
    // 基础修炼收益
    const baseGain = 10 + (user.realm * 3) + (user.spiritRoot * 2);
    // 功法加成
    const artBonus = user.arts.length * 3;
    // 气运加成
    const luckBonus = Math.floor(user.luck / 10);
    // 灵根加成
    const spiritRoot = this.spiritRoots[user.spiritRoot];
    
    // 总修为收益
    let expGain = Math.floor((baseGain + artBonus + luckBonus) * spiritRoot.expRate);
    let extraMsg = '';
    
    // 小概率触发顿悟
    if (Math.random() < 0.05) {
      expGain *= 3;
      extraMsg = '✨ 灵光乍现，顿悟大道！修为大幅增长！';
      user.luck = Math.min(100, user.luck + 5);
      user.comprehension = Math.min(10, user.comprehension + 0.2);
      
      // 添加日志
      this.addLog(userId, "修炼时顿悟，修为大幅增长");
    }
    
    // 触发随机事件
    const randomEvent = this.triggerRandomEvent('cultivate', user);
    if (randomEvent) {
      extraMsg += `\n${randomEvent.message} ${randomEvent.effect}`;
    }
    
    user.exp += expGain;
    user.lastCultivate = now;
    user.luck = Math.min(100, user.luck + 1);
    user.combatPower += Math.floor(expGain / 50);
    
    // 检查是否达到突破要求
    const currentRealm = this.realms[user.realm];
    if (user.exp >= currentRealm.maxExp && user.realm < this.realms.length - 1) {
      const nextRealm = this.realms[user.realm + 1];
      extraMsg += `\n🌅 修为已达圆满，可尝试 #突破 至 ${nextRealm.name}！`;
    }
    
    this.updateUserData(userId, user);
    this.cooldown.setCooldown(userId, 'cultivate', this.cdTimes.cultivate);
    
    // 添加日志
    this.addLog(userId, `修炼获得修为${expGain}`);
    
    await e.reply([
      `🧘 运转周天，炼化天地灵气...`,
      `✅ 修为 +${expGain}（当前：${user.exp}/${currentRealm.maxExp}）`,
      extraMsg
    ].join('\n'));
  }
  
  /** 突破境界 */
  async breakthrough(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    // 检查突破CD
    const cd = this.cooldown.getCooldown(userId, 'breakthrough');
    if (cd > 0) {
      const minutes = Math.ceil(cd / 60000);
      return e.reply(`🕒 突破需准备，请${minutes}分钟后再试`);
    }
    
    // 检查是否达到突破要求
    const currentRealm = this.realms[user.realm];
    if (user.exp < currentRealm.maxExp) {
      return e.reply(`❌ 修为不足！还需 ${currentRealm.maxExp - user.exp} 点修为方可突破`);
    }
    
    if (user.realm >= this.realms.length - 1) {
      return e.reply(`✅ 已是最高境界，请准备 #渡劫 飞升！`);
    }
    
    const nextRealm = this.realms[user.realm + 1];
    
    // 突破消耗灵石
    const stoneCost = (user.realm + 1) * 100;
    if (user.stone < stoneCost) {
      return e.reply(`❌ 灵石不足！突破需要 ${stoneCost} 灵石`);
    }
    
    // 突破成功率计算
    const baseSuccessRate = 60; // 基础成功率60%
    const realmPenalty = user.realm * 2; // 境界越高越难突破
    const spiritRoot = this.spiritRoots[user.spiritRoot];
    const spiritRootBonus = spiritRoot.breakthrough * 20; // 灵根加成
    const luckBonus = Math.floor(user.luck / 5); // 气运加成
    const daoHeartBonus = user.daoHeart * 5; // 道心加成
    
    // 功法加成
    let artBonus = 0;
    user.arts.forEach(artId => {
      const art = this.arts.find(a => a.id === artId);
      if (art && art.effect.includes("breakthrough")) {
        artBonus += 10;
      }
    });
    
    // 法宝加成
    let artifactBonus = 0;
    if (user.equippedArtifact) {
      const artifact = this.artifacts.find(a => a.id === user.equippedArtifact);
      if (artifact && artifact.effect.includes("突破成功率")) {
        artifactBonus = 5;
      }
    }
    
    const successRate = Math.max(10, 
      baseSuccessRate - realmPenalty + spiritRootBonus + luckBonus + daoHeartBonus + artBonus + artifactBonus
    );
    
    user.stone -= stoneCost;
    const success = Math.random() * 100 < successRate;
    
    let resultMsg = [];
    
    if (success) {
      // 突破成功
      user.realm++;
      user.exp = 0;
      user.combatPower += 50;
      user.daoHeart = Math.min(10, user.daoHeart + 0.5);
      
      resultMsg.push(
        `🌈 突破成功！`,
        `🎉 境界提升至：${nextRealm.name}！`,
        `💎 消耗灵石：${stoneCost}`,
        `❤️ 生命上限提升！`,
        `✨ 下一境界：${this.realms[user.realm + 1]?.name || '飞升'}（需 ${nextRealm.exp} 修为）`
      );
      
      // 添加日志
      this.addLog(userId, `成功突破至${nextRealm.name}`);
      
      // 成就系统
      if (!user.achievements.includes('breakthrough')) {
        user.achievements.push('breakthrough');
        resultMsg.push(`🎉 获得成就【初入仙途】！`);
      }
      
      // 触发随机事件
      const randomEvent = this.triggerRandomEvent('breakthrough', user);
      if (randomEvent) {
        resultMsg.push(`${randomEvent.message} ${randomEvent.effect}`);
      }
    } else {
      // 突破失败
      const damage = 15 + Math.floor(Math.random() * 25);
      user.life = Math.max(1, user.life - damage);
      user.daoHeart = Math.max(0.1, user.daoHeart - 0.2);
      
      resultMsg.push(
        `💥 突破失败！灵力反噬！`,
        `❤️ 生命值 -${damage}（当前：${user.life}/100）`,
        `💎 消耗灵石：${stoneCost}`,
        `😢 道心受损，下次突破成功率提升5%`
      );
      
      // 添加日志
      this.addLog(userId, `突破失败，损失生命值${damage}`);
    }
    
    user.luck = Math.min(100, user.luck + 3);
    this.updateUserData(userId, user);
    this.cooldown.setCooldown(userId, 'breakthrough', this.cdTimes.breakthrough);
    
    await e.reply(resultMsg.join('\n'));
  }
  
  /** 渡劫准备 */
  async tribulationPreparation(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    if (user.realm < this.realms.length - 3) {
      return e.reply("❌ 境界不足！至少需要渡劫初期才可准备渡劫");
    }
    
    // 随机选择天劫类型
    const tribulationType = this.tribulationTypes[Math.floor(Math.random() * this.tribulationTypes.length)];
    
    // 计算成功率
    const baseRate = 30;
    const pillBonus = user.pills[5] ? user.pills[5] * 5 : 0; // 渡劫丹加成
    const luckBonus = Math.floor(user.luck / 3);
    const daoHeartBonus = user.daoHeart * 8;
    
    // 功法加成
    let artBonus = 0;
    user.arts.forEach(artId => {
      const art = this.arts.find(a => a.id === artId);
      if (art && art.effect.includes("tribulation")) {
        artBonus += 15;
      }
    });
    
    // 法宝加成
    let artifactBonus = 0;
    if (user.equippedArtifact) {
      const artifact = this.artifacts.find(a => a.id === user.equippedArtifact);
      if (artifact && artifact.effect.includes("天劫伤害")) {
        artifactBonus = 10;
      }
    }
    
    const successRate = Math.min(95, baseRate + pillBonus + luckBonus + daoHeartBonus + artBonus + artifactBonus);
    
    const msg = [
      `⚡ 天劫预兆：${tribulationType.name}`,
      `📜 ${tribulationType.desc}`,
      `💔 预计伤害：${tribulationType.damage}%生命值`,
      `✅ 当前渡劫成功率：${successRate}%`,
      `🍀 气运值：${user.luck}/100`,
      `💖 道心：${user.daoHeart.toFixed(1)}/10`,
      `🔮 渡劫丹：${user.pills[5] || 0}枚`,
      `📜 护体功法：${artBonus > 0 ? "已掌握" : "未掌握"}`,
      `🔧 护身法宝：${artifactBonus > 0 ? "已装备" : "未装备"}`
    ];
    
    await e.reply(msg.join('\n'));
  }
  
  /** 渡劫飞升 */
  async tribulation(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    user.tribulationCount++;
    
    // 检查是否达到渡劫条件
    if (user.realm < this.realms.length - 3) {
      return e.reply(`❌ 境界不足！需达到渡劫初期方可渡劫`);
    }
    
    const currentRealm = this.realms[user.realm];
    if (user.exp < currentRealm.maxExp) {
      return e.reply(`❌ 修为不足！还需 ${currentRealm.maxExp - user.exp} 点修为方可渡劫`);
    }
    
    // 随机选择天劫类型
    const tribulationType = this.tribulationTypes[Math.floor(Math.random() * this.tribulationTypes.length)];
    
    // 渡劫成功率计算
    const baseSuccessRate = 30; // 基础成功率30%
    const pillBonus = user.pills[5] ? user.pills[5] * 5 : 0; // 渡劫丹加成
    const luckBonus = Math.floor(user.luck / 3); // 气运加成
    const daoHeartBonus = user.daoHeart * 8; // 道心加成
    
    // 功法加成
    let artBonus = 0;
    user.arts.forEach(artId => {
      const art = this.arts.find(a => a.id === artId);
      if (art && art.effect.includes("tribulation")) {
        artBonus += 15;
      }
    });
    
    // 法宝加成
    let artifactBonus = 0;
    if (user.equippedArtifact) {
      const artifact = this.artifacts.find(a => a.id === user.equippedArtifact);
      if (artifact && artifact.effect.includes("天劫伤害")) {
        artifactBonus = 10;
      }
    }
    
    const successRate = Math.min(95, baseSuccessRate + pillBonus + luckBonus + daoHeartBonus + artBonus + artifactBonus);
    
    const success = Math.random() * 100 < successRate;
    let resultMsg = [];
    
    resultMsg.push(`⚡ ${tribulationType.name}降临！`);
    
    // 添加天劫特效描述
    const tribulationDesc = {
      "三九天劫": "天空乌云密布，二十七道天雷接连劈下！",
      "六九天劫": "六重雷云笼罩天地，五十四道神雷撕裂苍穹！",
      "九九天劫": "九霄神雷汇聚，八十一道灭世雷霆轰然而至！",
      "心魔劫": "内心深处的恐惧被无限放大，心魔丛生！",
      "业火劫": "红莲业火从脚下升起，焚烧神魂！",
      "混沌劫": "混沌之气弥漫，万物归于虚无！"
    };
    
    resultMsg.push(tribulationDesc[tribulationType.name] || "天地变色，劫难降临！");
    
    if (success) {
      // 渡劫成功
      user.successCount++;
      user.realm = this.realms.length - 1; // 飞升期
      user.exp = 0;
      user.life = 200;
      user.combatPower += 1000;
      
      resultMsg.push(`🌈 霞光万道，仙门大开！`);
      resultMsg.push(`🎉 渡劫成功！飞升仙界！`);
      resultMsg.push(`✨ 当前境界：${this.realms[user.realm].name}`);
      
      // 宗门奖励
      if (user.sect) {
        const sect = this.sectData.get(user.sect);
        if (sect) {
          sect.prestige += 1000;
          sect.funds += 50000;
          resultMsg.push(`🏯 宗门 ${sect.name} 因你而声名大振！`);
        }
      }
    } else {
      // 渡劫失败
      const damage = Math.min(99, tribulationType.damage + Math.floor(Math.random() * 20));
      user.life = Math.max(1, user.life - damage);
      user.daoHeart = Math.max(0.1, user.daoHeart - 1);
      
      // 如果有九转还魂丹则保命
      if (user.pills[6] && user.pills[6] > 0) {
        user.pills[6]--;
        user.life = 1;
        resultMsg.push(`✨ 九转还魂丹生效，勉强保住性命`);
        resultMsg.push(`💔 消耗一枚九转还魂丹`);
      } else {
        user.realm = Math.max(0, user.realm - 3);
        user.exp = 0;
        resultMsg.push(`💥 渡劫失败，境界跌落至 ${this.realms[user.realm].name}`);
      }
      
      resultMsg.push(`❤️ 生命值降为${user.life}`);
    }
    
    this.updateUserData(userId, user);
    await e.reply(resultMsg.join('\n'));
  }
  
  /** 灵根测试 */
  async spiritRootTest(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    // 如果已有灵根且不是最低级，则不再测试
    if (user.spiritRoot > 0 && user.spiritRoot > 1) {
      return e.reply(`✨ 当前灵根：${this.spiritRoots[user.spiritRoot].name}（无需重复测试）`);
    }
    
    // 消耗灵石
    if (user.stone < 300) {
      return e.reply("❌ 灵根测试需要300灵石");
    }
    
    user.stone -= 300;
    
    // 随机生成灵根（偏向低品质）
    let rootLevel;
    if (Math.random() < 0.05) {
      // 5%概率获得高级灵根
      rootLevel = Math.min(
        this.spiritRoots.length - 1,
        5 + Math.floor(Math.random() * 5)
      );
    } else {
      rootLevel = Math.min(
        this.spiritRoots.length - 1,
        Math.floor(Math.random() * 5) + Math.floor(Math.random() * 3)
      );
    }
    
    user.spiritRoot = rootLevel;
    this.updateUserData(userId, user);
    
    const spiritRoot = this.spiritRoots[rootLevel];
    await e.reply([
      `🔮 灵根测试中...`,
      `✨ 灵根显现：${spiritRoot.name}！`,
      `📊 属性加成：`,
      `  修炼效率 ×${spiritRoot.expRate}`,
      `  炼丹加成 ×${spiritRoot.alchemy}`,
      `  突破加成 ×${spiritRoot.breakthrough}`,
      `  气运加成 +${spiritRoot.luck}`,
      rootLevel >= 4 ? `🎉 资质上佳，前途无量！` : `💪 勤能补拙，天道酬勤！`
    ].join('\n'));
  }
  
  /** 查看丹药 */
  async viewPills(e) {
    const pillList = this.pills.map(p => 
      `${p.id}. ${p.name} ★${p.quality} - ${p.desc}\n  效果: ${p.effect > 0 ? `+${p.effect}修为` : p.id === 8 ? '提升灵根资质' : '保命'} | 消耗: ${p.cost}灵石`
    ).join('\n');
    
    await e.reply([
      '📜 丹方名录',
      '================================',
      pillList,
      '================================',
      '使用 #炼丹 [丹药ID] 炼制丹药',
      '使用 #服用丹药 [丹药ID] 使用丹药'
    ].join('\n'));
  }
  
  /** 炼制丹药 */
  async alchemy(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    const pillId = parseInt(e.msg.replace(/^#炼丹\s+/, ''));
    
    const pill = this.pills.find(p => p.id === pillId);
    if (!pill) return e.reply('❌ 丹方不存在');
    
    if (user.stone < pill.cost) {
      return e.reply(`❌ 灵石不足！需要 ${pill.cost} 灵石`);
    }
    
    // 炼丹成功率（受灵根影响）
    const spiritRoot = this.spiritRoots[user.spiritRoot];
    const baseSuccessRate = 60;
    const successRate = baseSuccessRate + (spiritRoot.alchemy * 20);
    const success = Math.random() * 100 < successRate;
    
    if (success) {
      user.stone -= pill.cost;
      if (!user.pills[pillId]) user.pills[pillId] = 0;
      user.pills[pillId]++;
      
      await e.reply([
        `🔥 丹炉运转，药香四溢...`,
        `✅ 成功炼制 ${pill.name} ×1！`,
        `💎 消耗灵石：${pill.cost}`
      ].join('\n'));
    } else {
      user.stone -= Math.floor(pill.cost / 2);
      await e.reply([
        `💥 丹炉炸裂，炼制失败！`,
        `💎 损失灵石：${Math.floor(pill.cost / 2)}`,
        `😢 下次炼制成功率提升5%`
      ].join('\n'));
    }
    
    this.updateUserData(userId, user);
    this.cooldown.setCooldown(userId, 'alchemy', this.cdTimes.alchemy);
  }
  
  /** 服用丹药 */
  async takePill(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    const pillId = parseInt(e.msg.replace(/^#服用丹药\s+/, ''));
    
    const pill = this.pills.find(p => p.id === pillId);
    if (!pill) return e.reply('❌ 丹药不存在');
    
    if (!user.pills[pillId] || user.pills[pillId] <= 0) {
      return e.reply(`❌ 没有 ${pill.name}，请先炼制`);
    }
    
    user.pills[pillId]--;
    
    if (pill.effect > 0) {
      // 修为丹药
      user.exp += pill.effect;
      await e.reply([
        `🍵 服用 ${pill.name}，灵力涌动...`,
        `✨ 修为 +${pill.effect}（当前：${user.exp}/${this.realms[user.realm].maxExp}）`
      ].join('\n'));
    } else if (pill.id === 8) {
      // 太虚神丹 - 提升灵根
      if (user.spiritRoot < this.spiritRoots.length - 1) {
        user.spiritRoot++;
        const newRoot = this.spiritRoots[user.spiritRoot];
        await e.reply([
          `🍵 服用 ${pill.name}，脱胎换骨...`,
          `✨ 灵根提升至：${newRoot.name}！`,
          `📊 属性加成：`,
          `  修炼效率 ×${newRoot.expRate}`,
          `  炼丹加成 ×${newRoot.alchemy}`,
          `  突破加成 ×${newRoot.breakthrough}`,
          `  气运加成 +${newRoot.luck}`
        ].join('\n'));
      } else {
        user.exp += 100000;
        await e.reply([
          `🍵 服用 ${pill.name}，但灵根已至极限`,
          `✨ 修为 +100000（当前：${user.exp}/${this.realms[user.realm].maxExp}）`
        ].join('\n'));
      }
    } else {
      // 特殊丹药
      user.life = Math.min(100, user.life + 50);
      await e.reply([
        `🍵 服用 ${pill.name}，伤势恢复...`,
        `❤️ 生命值 +50（当前：${user.life}/100）`
      ].join('\n'));
    }
    
    this.updateUserData(userId, user);
  }
  
  /** 闭关修炼 */
  async seclusion(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    const now = Date.now();
    
    // 解析闭关时间
    const match = e.msg.match(/^#闭关\s*(?:(\d+)\s*(天|时辰)?)?$/);
    let duration = match[1] ? parseInt(match[1]) : 1;
    let unit = match[2] || '时辰';
    
    // 换算成毫秒（1时辰=2小时）
    const hours = unit === '天' ? duration * 24 : duration * 2;
    const ms = hours * 60 * 60 * 1000;
    
    // 检查闭关CD
    if (now - user.lastSeclusion < this.cdTimes.seclusion) {
      const remaining = Math.ceil((this.cdTimes.seclusion - (now - user.lastSeclusion)) / 3600000);
      return e.reply(`🕒 心魔未消，请${remaining}小时后再闭关`);
    }
    
    // 消耗灵石
    const stoneCost = hours * 20;
    if (user.stone < stoneCost) {
      return e.reply(`❌ 闭关需要${stoneCost}灵石维持阵法`);
    }
    
    user.stone -= stoneCost;
    
    // 计算闭关收益
    const expGain = Math.floor(
      (50 + (user.realm * 15) + (user.spiritRoot * 8)) * hours * this.spiritRoots[user.spiritRoot].expRate
    );
    
    user.exp += expGain;
    user.lastSeclusion = now;
    user.luck = Math.min(100, user.luck + 5);
    user.combatPower += Math.floor(expGain / 100);
    
    this.updateUserData(userId, user);
    
    await e.reply([
      `🧘 开始闭关修炼 ${duration}${unit}...`,
      `🕒 时光飞逝，闭关结束`,
      `✨ 修为 +${expGain}（当前：${user.exp}/${this.realms[user.realm].maxExp})`,
      `💎 消耗灵石：${stoneCost}`,
      `🍀 气运 +5`,
      `⚔️ 战斗力 +${Math.floor(expGain / 100)}`
    ].join('\n'));
  }
  
  /** 领悟功法 */
  async comprehendArt(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    // 检查领悟CD
    const cd = this.cooldown.getCooldown(userId, 'comprehendArt');
    if (cd > 0) {
      const minutes = Math.ceil(cd / 60000);
      return e.reply(`🕒 领悟需静心，请${minutes}分钟后再试`);
    }
    
    // 检查灵石
    const stoneCost = 500 + user.arts.length * 200;
    if (user.stone < stoneCost) {
      return e.reply(`❌ 领悟功法需要${stoneCost}灵石`);
    }
    
    // 已有全部功法
    if (user.arts.length >= this.arts.length) {
      return e.reply('✅ 已领悟所有功法，融会贯通！');
    }
    
    // 随机选择未领悟的功法
    const availableArts = this.arts.filter(art => !user.arts.includes(art.id));
    if (availableArts.length === 0) return;
    
    const newArt = availableArts[Math.floor(Math.random() * availableArts.length)];
    
    // 领悟成功率
    const successRate = 40 + (user.spiritRoot * 5) + Math.floor(user.luck / 5) + (user.comprehension * 10);
    const success = Math.random() * 100 < successRate;
    
    if (success) {
      user.arts.push(newArt.id);
      user.stone -= stoneCost;
      user.comprehension = Math.min(10, user.comprehension + 0.3);
      await e.reply([
        `📜 参悟天地至理...`,
        `✨ 领悟新功法：${newArt.name}！`,
        `📊 功法效果：${newArt.effect}`,
        `💎 消耗灵石：${stoneCost}`,
        `🧠 悟性 +0.3`
      ].join('\n'));
    } else {
      user.stone -= Math.floor(stoneCost / 2);
      await e.reply([
        `💥 参悟失败，心神震荡！`,
        `💎 损失灵石：${Math.floor(stoneCost / 2)}`,
        `😢 下次领悟成功率提升5%`
      ].join('\n'));
    }
    
    this.updateUserData(userId, user);
    this.cooldown.setCooldown(userId, 'comprehendArt', this.cdTimes.comprehendArt);
  }
  
  /** 奇遇事件 */
  async adventure(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    const now = Date.now();
    
    // 奇遇CD
    if (now - user.lastAdventure < this.cdTimes.adventure) {
      const remaining = Math.ceil((this.cdTimes.adventure - (now - user.lastAdventure)) / 60000);
      return e.reply(`🕒 机缘未至，请${remaining}分钟后再探索`);
    }
    
    user.lastAdventure = now;
    
    // 高级奇遇概率（随境界提升）
    const advancedChance = Math.min(0.5, user.realm * 0.02);
    
    const events = [
      {
        name: "发现灵石矿",
        effect: () => { 
          const gain = 300 + Math.floor(Math.random() * 700);
          user.stone += gain;
          return `💎 获得 ${gain} 灵石`;
        }
      },
      {
        name: "遭遇妖兽",
        effect: () => {
          const damage = 15 + Math.floor(Math.random() * 35);
          user.life = Math.max(1, user.life - damage);
          return `🐺 遭遇妖兽袭击！❤️ 生命值 -${damage}`;
        }
      },
      {
        name: "仙人洞府",
        effect: () => {
          const expGain = 500 + Math.floor(Math.random() * 1500);
          user.exp += expGain;
          return `🏯 发现仙人洞府，✨ 修为 +${expGain}`;
        }
      },
      {
        name: "灵药园",
        effect: () => {
          const pillId = 1 + Math.floor(Math.random() * 4);
          if (!user.pills[pillId]) user.pills[pillId] = 0;
          user.pills[pillId] += 2;
          return `🌿 发现灵药园，获得 ${this.pills.find(p => p.id === pillId).name} ×2`;
        }
      },
      {
        name: "前辈传承",
        effect: () => {
          user.luck += 15;
          user.comprehension += 0.5;
          return `👴 获得前辈传承，🍀 气运 +15，🧠 悟性 +0.5`;
        },
        advanced: true
      },
      {
        name: "上古遗迹",
        effect: () => {
          const artifactId = 1 + Math.floor(Math.random() * 3);
          user.artifacts.push(artifactId);
          return `🏛️ 发现上古遗迹，获得法宝 ${this.artifacts.find(a => a.id === artifactId).name}！`;
        },
        advanced: true
      },
      {
        name: "悟道古树",
        effect: () => {
          user.daoHeart += 1;
          return `🌳 在悟道古树下参悟，💖 道心 +1`;
        },
        advanced: true
      }
    ];
    
    // 筛选可用事件
    let availableEvents = events.filter(e => !e.advanced);
    if (Math.random() < advancedChance) {
      availableEvents = availableEvents.concat(events.filter(e => e.advanced));
    }
    
    const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    const result = event.effect();
    
    this.updateUserData(userId, user);
    
    // 添加日志
    this.addLog(userId, `奇遇：${event.name} - ${result}`);
    
    await e.reply([
      `🌄 探索修仙界...`,
      `✨ 奇遇：${event.name}`,
      result
    ].join('\n'));
  }
  
  /** 挑战秘境 */
  async challengeDungeon(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    const now = Date.now();
    
    // 解析秘境层级
    const match = e.msg.match(/^#挑战秘境\s*(\d+)?$/);
    let dungeonLevel = match[1] ? parseInt(match[1]) : 1;
    
    // 检查CD
    if (now - user.lastDungeon < this.cdTimes.dungeon) {
      const remaining = Math.ceil((this.cdTimes.dungeon - (now - user.lastDungeon)) / 60000);
      return e.reply(`🕒 秘境尚未恢复，请${remaining}分钟后再挑战`);
    }
    
    // 检查境界是否足够
    const dungeon = this.dungeons[dungeonLevel - 1];
    if (!dungeon) {
      return e.reply(`❌ 秘境层级 ${dungeonLevel} 不存在，可用层级：1-${this.dungeons.length}`);
    }
    
    if (user.realm < dungeon.minRealm) {
      return e.reply(`❌ 境界不足！需要 ${this.realms[dungeon.minRealm].name} 才能挑战 ${dungeon.name}`);
    }
    
    user.lastDungeon = now;
    
    // 计算挑战结果
    const successRate = 60 + (user.combatPower * 0.1) + (user.luck / 2);
    const success = Math.random() * 100 < successRate;
    
    let resultMsg = [`🏞️ 进入秘境：${dungeon.name}...`];
    
    if (success) {
      // 秘境挑战成功
      let stoneGain, expGain;
      
      switch(dungeonLevel) {
        case 1:
          stoneGain = 100 + Math.floor(Math.random() * 200);
          expGain = 50 + Math.floor(Math.random() * 100);
          break;
        case 2:
          stoneGain = 300 + Math.floor(Math.random() * 500);
          expGain = 200 + Math.floor(Math.random() * 300);
          break;
        case 3:
          stoneGain = 1000 + Math.floor(Math.random() * 2000);
          expGain = 800 + Math.floor(Math.random() * 1200);
          break;
        case 4:
          stoneGain = 5000 + Math.floor(Math.random() * 10000);
          expGain = 3000 + Math.floor(Math.random() * 5000);
          break;
        case 5:
          stoneGain = 20000 + Math.floor(Math.random() * 30000);
          expGain = 15000 + Math.floor(Math.random() * 25000);
          break;
      }
      
      user.stone += stoneGain;
      user.exp += expGain;
      user.combatPower += dungeonLevel * 10;
      
      resultMsg.push(`✅ 成功挑战秘境！`);
      resultMsg.push(`💎 获得灵石：${stoneGain}`);
      resultMsg.push(`✨ 获得修为：${expGain}`);
      resultMsg.push(`⚔️ 战斗力 +${dungeonLevel * 10}`);
      
      // 概率获得额外奖励
      if (Math.random() < 0.3) {
        const pillId = dungeonLevel + Math.floor(Math.random() * 2);
        if (pillId <= this.pills.length) {
          if (!user.pills[pillId]) user.pills[pillId] = 0;
          user.pills[pillId]++;
          resultMsg.push(`💊 额外获得：${this.pills[pillId-1].name} ×1`);
        }
      }
      
      // 高等级秘境概率获得法宝
      if (dungeonLevel >= 4 && Math.random() < 0.2) {
        const artifactId = dungeonLevel - 1;
        if (!user.artifacts.includes(artifactId)) {
          user.artifacts.push(artifactId);
          resultMsg.push(`🔮 获得法宝：${this.artifacts[artifactId-1].name}！`);
        }
      }
    } else {
      // 秘境挑战失败
      const damage = 20 + Math.floor(Math.random() * 30);
      user.life = Math.max(1, user.life - damage);
      resultMsg.push(`💥 挑战失败，遭遇秘境守卫！`);
      resultMsg.push(`❤️ 生命值 -${damage}`);
    }
    
    this.updateUserData(userId, user);
    
    // 添加日志
    this.addLog(userId, `挑战秘境 ${dungeon.name} ${success ? '成功' : '失败'}`);
    
    await e.reply(resultMsg.join('\n'));
  }
  
  /** 双修 */
  async dualCultivation(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    // 检查双修CD
    const cd = this.cooldown.getCooldown(userId, 'dualCultivation');
    if (cd > 0) {
      const minutes = Math.ceil(cd / 60000);
      return e.reply(`🕒 双修需调息，请${minutes}分钟后再试`);
    }
    
    // 解析双修对象
    const match = e.msg.match(/^#双修\s*@?(\d+)?$/);
    const targetId = match[1] || e.at;
    
    if (!targetId) {
      return e.reply("❌ 请@指定双修对象");
    }
    
    if (targetId === userId) {
      return e.reply("❌ 不能与自己双修");
    }
    
    const targetUser = this.getUserData(targetId);
    
    // 检查对方是否在线（简化处理）
    if (Math.random() < 0.1) {
      return e.reply("❌ 对方不在线，无法双修");
    }
    
    // 发送双修请求
    this.cooldown.addDualCultivationRequest(userId, targetId);
    
    await e.reply([
      `💌 ${e.at} 道友，${e.sender.card || e.sender.nickname} 邀请你双修`,
      `✨ 双修可大幅提升双方修为`,
      `✅ 同意请回复 #同意双修`,
      `⏳ 请求有效时间：2分钟`
    ].join('\n'));
  }
  
  /** 处理双修同意 */
  async handleDualCultivationAgreement(e) {
    const userId = e.user_id;
    const request = this.cooldown.getDualCultivationRequest(userId);
    
    if (!request) {
      return e.reply("❌ 没有待处理的双修请求");
    }
    
    const requesterId = request.requesterId;
    const user = this.getUserData(userId);
    const requester = this.getUserData(requesterId);
    
    // 双修收益
    const baseGain = 50 + (user.realm + requester.realm) * 5;
    const expGain = Math.floor(baseGain * 1.5);
    
    user.exp += expGain;
    requester.exp += expGain;
    user.luck = Math.min(100, user.luck + 5);
    requester.luck = Math.min(100, requester.luck + 5);
    
    this.updateUserData(userId, user);
    this.updateUserData(requesterId, requester);
    
    // 设置冷却时间
    this.cooldown.setCooldown(userId, 'dualCultivation', this.cdTimes.dualCultivation);
    this.cooldown.setCooldown(requesterId, 'dualCultivation', this.cdTimes.dualCultivation);
    this.cooldown.removeDualCultivationRequest(userId);
    
    // 添加日志
    this.addLog(userId, `与${this.getUserName(requesterId)}双修，获得修为${expGain}`);
    this.addLog(requesterId, `与${this.getUserName(userId)}双修，获得修为${expGain}`);
    
    // 通知双方
    await e.reply([
      `💞 ${e.sender.card || e.sender.nickname} 与 ${this.getUserName(requesterId)} 开始双修...`,
      `✨ 双方修为 +${expGain}`,
      `🍀 双方气运 +5`,
      `💖 阴阳调和，大道可期！`
    ].join('\n'));
    
    // 通知请求者
    await this.app.bot.sendPrivateMsg(requesterId, [
      `💞 ${this.getUserName(userId)} 已同意你的双修请求`,
      `✨ 你获得修为 +${expGain}`,
      `🍀 气运 +5`
    ].join('\n'));
  }
  
  /** 炼制法宝 */
  async forgeArtifact(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    // 解析法宝ID
    const match = e.msg.match(/^#炼制法宝\s*(\d+)?$/);
    let artifactId = match[1] ? parseInt(match[1]) : 1;
    
    const artifact = this.artifacts.find(a => a.id === artifactId);
    if (!artifact) {
      return e.reply(`❌ 法宝ID ${artifactId} 不存在`);
    }
    
    // 检查境界
    if (user.realm < artifact.level * 2) {
      return e.reply(`❌ 境界不足！需要 ${this.realms[artifact.level * 2].name} 才能炼制 ${artifact.name}`);
    }
    
    // 检查灵石
    if (user.stone < artifact.cost) {
      return e.reply(`❌ 灵石不足！需要 ${artifact.cost} 灵石`);
    }
    
    // 检查是否已拥有
    if (user.artifacts.includes(artifactId)) {
      return e.reply(`❌ 已拥有 ${artifact.name}，无需重复炼制`);
    }
    
    // 炼制成功率
    const successRate = 70 + (user.spiritRoot * 5) + Math.floor(user.luck / 5);
    const success = Math.random() * 100 < successRate;
    
    if (success) {
      user.artifacts.push(artifactId);
      user.stone -= artifact.cost;
      await e.reply([
        `🔥 开始炼制 ${artifact.name}...`,
        `✨ 炼制成功！`,
        `🔮 获得法宝：${artifact.name}`,
        `📊 法宝效果：${artifact.effect}`,
        `💎 消耗灵石：${artifact.cost}`
      ].join('\n'));
    } else {
      user.stone -= Math.floor(artifact.cost / 2);
      await e.reply([
        `💥 炼制失败！`,
        `💎 损失灵石：${Math.floor(artifact.cost / 2)}`,
        `😢 下次炼制成功率提升5%`
      ].join('\n'));
    }
    
    this.updateUserData(userId, user);
  }
  
  /** 装备法宝 */
  async equipArtifact(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    // 解析法宝ID
    const match = e.msg.match(/^#装备法宝\s*(\d+)?$/);
    const artifactId = match[1] ? parseInt(match[1]) : null;
    
    if (!artifactId) {
      // 显示法宝列表
      if (user.artifacts.length === 0) {
        return e.reply("❌ 你还没有任何法宝，请先 #炼制法宝");
      }
      
      let msg = "📦 你的法宝列表：\n";
      user.artifacts.forEach(id => {
        const artifact = this.artifacts.find(a => a.id === id);
        msg += `${id}. ${artifact.name} - ${artifact.effect}\n`;
      });
      msg += "\n使用 #装备法宝 [ID] 装备法宝";
      return e.reply(msg);
    }
    
    // 检查是否拥有该法宝
    if (!user.artifacts.includes(artifactId)) {
      return e.reply(`❌ 未拥有ID为 ${artifactId} 的法宝`);
    }
    
    user.equippedArtifact = artifactId;
    this.updateUserData(userId, user);
    
    const artifact = this.artifacts.find(a => a.id === artifactId);
    await e.reply(`🔮 已装备法宝：${artifact.name}\n📊 效果：${artifact.effect}`);
  }
  
  /** 宗门信息 */
  async sectInfo(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    if (!user.sect) {
      return e.reply("❌ 你尚未加入任何宗门\n使用 #创建宗门 [名称] 创建宗门 或 #加入宗门 [名称] 加入已有宗门");
    }
    
    const sect = this.sectData.get(user.sect);
    if (!sect) {
      return e.reply("❌ 宗门数据异常，请联系管理员");
    }
    
    let msg = [
      `🏯 宗门：${sect.name}`,
      `⭐ 等级：${sect.level}`,
      `🎖️ 声望：${sect.prestige}`,
      `💎 资金：${sect.funds}`,
      `👥 成员：${sect.members.length}人`,
      `👑 宗主：${sect.leaderName}`,
      `📜 宗门福利：`,
      `  每日灵石：${sect.level * 50}`,
      `  每周资金：${sect.members.length * 100 * sect.level}`,
      `  修炼效率：+${sect.level * 5}%`,
      `\n📢 宗门公告：${sect.notice || "暂无公告"}`
    ];
    
    // 显示宗门成员（最多10人）
    if (sect.members.length > 0) {
      msg.push("\n👥 核心成员：");
      const topMembers = sect.members
        .map(id => ({id, ...this.getUserData(id)}))
        .sort((a, b) => b.realm - a.realm || b.combatPower - a.combatPower)
        .slice(0, 5);
      
      topMembers.forEach(member => {
        msg.push(`  ${member.title} ${this.getUserName(member.id)} - ${this.realms[member.realm].name}`);
      });
    }
    
    await e.reply(msg.join('\n'));
  }
  
  /** 加入宗门 */
  async joinSect(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    if (user.sect) {
      return e.reply(`❌ 你已加入宗门，无法加入其他宗门`);
    }
    
    const sectName = e.msg.replace(/^#加入宗门\s+/, '').trim();
    if (!sectName) {
      return e.reply("❌ 请输入宗门名称");
    }
    
    // 查找宗门
    const sects = this.sectData.getAll();
    const sectId = Object.keys(sects).find(id => 
      sects[id].name === sectName
    );
    
    if (!sectId) {
      return e.reply(`❌ 未找到名为 ${sectName} 的宗门`);
    }
    
    const sect = sects[sectId];
    if (sect.members.length >= 50) {
      return e.reply("❌ 该宗门成员已满");
    }
    
    user.sect = sectId;
    user.title = "外门弟子";
    sect.members.push(userId);
    
    this.updateUserData(userId, user);
    this.sectData.set(sectId, sect);
    
    await e.reply([
      `🎉 成功加入宗门：${sect.name}`,
      `👥 当前成员：${sect.members.length}人`,
      `📜 宗门公告：${sect.notice || "暂无公告"}`,
      `💎 每日可领取 ${sect.level * 50} 灵石福利`
    ].join('\n'));
  }
  
  /** 创建宗门 */
  async createSect(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    if (user.sect) {
      return e.reply(`❌ 你已加入宗门，无法创建新宗门`);
    }
    
    if (user.realm < 10) {
      return e.reply("❌ 创建宗门需要金丹期以上境界");
    }
    
    const sectName = e.msg.replace(/^#创建宗门\s+/, '').trim();
    if (!sectName) {
      return e.reply("❌ 请输入宗门名称");
    }
    
    // 检查名称是否已存在
    const sects = this.sectData.getAll();
    if (Object.values(sects).some(s => s.name === sectName)) {
      return e.reply(`❌ 宗门名称 ${sectName} 已被使用`);
    }
    
    // 创建宗门
    const sectId = `sect_${Date.now()}`;
    this.sectData.set(sectId, {
      name: sectName,
      level: 1,
      prestige: 100,
      funds: 1000,
      leader: userId,
      leaderName: e.sender.card || e.sender.nickname,
      members: [userId],
      notice: "",
      createTime: Date.now()
    });
    
    user.sect = sectId;
    user.title = "宗主";
    this.updateUserData(userId, user);
    
    await e.reply([
      `🎉 宗门创建成功！`,
      `🏯 宗门名称：${sectName}`,
      `👑 宗主：${e.sender.card || e.sender.nickname}`,
      `📢 使用 #宗门 查看宗门信息`,
      `💎 初始资金：1000灵石`
    ].join('\n'));
  }
  
  /** 修仙排行榜 */
  async cultivationRank(e) {
    // 获取所有用户数据
    const users = Object.entries(this.userData.getAll())
      .map(([id, data]) => ({
        id,
        realm: data.realm,
        exp: data.exp,
        combatPower: data.combatPower,
        name: this.getUserName(id)
      }))
      .sort((a, b) => {
        if (b.realm !== a.realm) return b.realm - a.realm;
        if (b.combatPower !== a.combatPower) return b.combatPower - a.combatPower;
        return b.exp - a.exp;
      })
      .slice(0, 10); // 取前10名
    
    if (users.length === 0) {
      return e.reply('📭 尚无修仙者数据');
    }
    
    const rankList = users.map((u, i) => 
      `${i + 1}. ${u.name} - ${this.realms[u.realm].name} ⚔️${u.combatPower}`
    ).join('\n');
    
    const userRank = users.findIndex(u => u.id === e.user_id) + 1 || '未上榜';
    
    await e.reply([
      '🏆 修仙排行榜',
      '=======================',
      rankList,
      '=======================',
      `你的排名：${userRank}`
    ].join('\n'));
  }
  
  /** 宗门任务 */
  async sectMission(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    if (!user.sect) {
      return e.reply("❌ 请先加入宗门");
    }
    
    const missions = [
      { name: "采集灵草", reward: { stone: 100, exp: 50, contribution: 10 } },
      { name: "守卫宗门", reward: { stone: 200, exp: 100, contribution: 20 } },
      { name: "炼制丹药", reward: { stone: 300, exp: 150, contribution: 30 } },
      { name: "教导弟子", reward: { stone: 150, exp: 200, contribution: 25 } },
      { name: "探索秘境", reward: { stone: 400, exp: 300, contribution: 40 } }
    ];
    
    const mission = missions[Math.floor(Math.random() * missions.length)];
    
    user.stone += mission.reward.stone;
    user.exp += mission.reward.exp;
    user.contribution += mission.reward.contribution;
    
    this.updateUserData(userId, user);
    
    // 添加日志
    this.addLog(userId, `完成宗门任务【${mission.name}】`);
    
    await e.reply([
      `📜 完成宗门任务：${mission.name}`,
      `💎 获得灵石：${mission.reward.stone}`,
      `✨ 获得修为：${mission.reward.exp}`,
      `🎖️ 获得贡献：${mission.reward.contribution}`
    ].join('\n'));
  }
  
  /** 修仙日志 */
  async cultivationLog(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    if (user.logs.length === 0) {
      return e.reply("📭 尚无修仙日志");
    }
    
    const logList = user.logs.slice().reverse().slice(0, 5).map(log => 
      `[${new Date(log.time).toLocaleTimeString()}] ${log.content}`
    ).join('\n');
    
    await e.reply([
      '📜 修仙日志（最近5条）',
      '=======================',
      logList,
      '=======================',
      `共记录 ${user.logs.length} 条修仙历程`
    ].join('\n'));
  }
  
  /** 查看背包 */
  async viewBackpack(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    // 初始化背包
    if (!user.backpack) {
      user.backpack = {
        items: {},
        capacity: 20
      };
      this.updateUserData(userId, user);
    }
    
    const backpack = user.backpack;
    
    let msg = ["🎒 你的背包"];
    
    // 显示货币
    msg.push(`💎 灵石: ${user.stone}`);
    
    // 显示丹药
    if (Object.keys(user.pills).length > 0) {
      msg.push("\n💊 丹药:");
      for (const [pillId, count] of Object.entries(user.pills)) {
        const pill = this.pills.find(p => p.id == pillId);
        if (pill) {
          msg.push(`  ${pill.name} x${count}`);
        }
      }
    }
    
    // 显示法宝
    if (user.artifacts.length > 0) {
      msg.push("\n🔮 法宝:");
      user.artifacts.forEach(id => {
        const artifact = this.artifacts.find(a => a.id === id);
        if (artifact) {
          msg.push(`  ${artifact.name}${id === user.equippedArtifact ? ' (已装备)' : ''}`);
        }
      });
    }
    
    // 显示功法
    if (user.arts.length > 0) {
      msg.push("\n📜 功法:");
      user.arts.forEach(id => {
        const art = this.arts.find(a => a.id === id);
        if (art) {
          msg.push(`  ${art.name}`);
        }
      });
    }
    
    // 显示背包物品
    if (Object.keys(backpack.items).length > 0) {
      msg.push("\n📦 物品:");
      for (const [itemId, count] of Object.entries(backpack.items)) {
        const item = this.backpackItems.find(i => i.id == itemId);
        if (item) {
          msg.push(`  ${item.name} x${count}`);
        }
      }
    }
    
    // 显示背包容量
    const itemCount = Object.values(backpack.items).reduce((sum, count) => sum + count, 0);
    msg.push(`\n📏 背包容量: ${itemCount}/${backpack.capacity}`);
    
    await e.reply(msg.join('\n'));
  }
  
  /** 查看商店 */
  async viewShop(e) {
    const shopList = this.shopItems.map(item => 
      `${item.id}. ${item.name} - ${item.desc}\n  效果: ${item.effect} | 价格: ${item.price}灵石`
    ).join('\n');
    
    await e.reply([
      '🏪 修仙商店',
      '================================',
      shopList,
      '================================',
      '使用 #购买 [物品ID] [数量] 购买物品',
      '使用 #出售 [物品ID] [数量] 出售物品'
    ].join('\n'));
  }
  
  /** 购买物品 */
  async buyItem(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    const match = e.msg.match(/^#购买\s+(\d+)\s*(\d+)?$/);
    const itemId = parseInt(match[1]);
    const quantity = match[2] ? parseInt(match[2]) : 1;
    
    const shopItem = this.shopItems.find(item => item.id === itemId);
    if (!shopItem) {
      return e.reply('❌ 商店中没有该物品');
    }
    
    // 初始化背包
    if (!user.backpack) {
      user.backpack = {
        items: {},
        capacity: 20
      };
    }
    
    const totalCost = shopItem.price * quantity;
    if (user.stone < totalCost) {
      return e.reply(`❌ 灵石不足！需要 ${totalCost} 灵石`);
    }
    
    // 检查背包容量
    const itemCount = Object.values(user.backpack.items).reduce((sum, count) => sum + count, 0);
    if (itemCount + quantity > user.backpack.capacity) {
      return e.reply(`❌ 背包空间不足！需要 ${quantity} 格空间，剩余 ${user.backpack.capacity - itemCount} 格`);
    }
    
    // 购买物品
    user.stone -= totalCost;
    
    // 处理不同类型的物品
    let resultMsg = `✅ 购买成功！获得 ${shopItem.name} x${quantity}`;
    
    switch(shopItem.type) {
      case 'pill_recipe':
        // 学习丹药配方
        if (!user.pills[1]) user.pills[1] = 0;
        user.pills[1] += quantity;
        resultMsg += `\n💊 已学会炼制 ${this.pills[0].name}`;
        break;
        
      case 'artifact_blueprint':
        // 学习法宝图谱
        if (!user.artifacts.includes(1)) {
          user.artifacts.push(1);
          resultMsg += `\n🔮 已学会炼制 ${this.artifacts[0].name}`;
        }
        break;
        
      case 'art_book':
        // 学习功法
        if (!user.arts.includes(1)) {
          user.arts.push(1);
          resultMsg += `\n📜 已领悟 ${this.arts[0].name}`;
        }
        break;
        
      case 'tool':
        // 特殊工具
        if (shopItem.id === 5) {
          // 灵根测试石
          resultMsg += `\n🔮 使用 #灵根测试 来测试你的灵根资质`;
        }
        break;
        
      case 'bag':
        // 扩展背包
        user.backpack.capacity += 10 * quantity;
        resultMsg += `\n🎒 背包容量增加 ${10 * quantity} 格`;
        break;
        
      default:
        // 普通物品放入背包
        if (!user.backpack.items[itemId]) {
          user.backpack.items[itemId] = 0;
        }
        user.backpack.items[itemId] += quantity;
    }
    
    this.updateUserData(userId, user);
    
    // 添加日志
    this.addLog(userId, `购买 ${shopItem.name} x${quantity}`);
    
    await e.reply(resultMsg);
  }
  
  /** 出售物品 */
  async sellItem(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    const match = e.msg.match(/^#出售\s+(\d+)\s*(\d+)?$/);
    const itemId = parseInt(match[1]);
    const quantity = match[2] ? parseInt(match[2]) : 1;
    
    // 检查背包系统
    if (!user.backpack || !user.backpack.items[itemId] || user.backpack.items[itemId] < quantity) {
      return e.reply('❌ 没有足够的物品可以出售');
    }
    
    const backpackItem = this.backpackItems.find(item => item.id === itemId);
    if (!backpackItem) {
      return e.reply('❌ 无效的物品ID');
    }
    
    // 出售物品
    const totalValue = backpackItem.value * quantity;
    user.stone += totalValue;
    user.backpack.items[itemId] -= quantity;
    
    // 清理空物品
    if (user.backpack.items[itemId] <= 0) {
      delete user.backpack.items[itemId];
    }
    
    this.updateUserData(userId, user);
    
    // 添加日志
    this.addLog(userId, `出售 ${backpackItem.name} x${quantity}`);
    
    await e.reply(`✅ 出售成功！获得 ${totalValue} 灵石`);
  }
  
  /** 查看法宝系统 */
  async viewArtifactsSystem(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    const artifactList = this.artifacts.map(artifact => {
      const owned = user.artifacts.includes(artifact.id);
      const equipped = user.equippedArtifact === artifact.id;
      let status = '';
      
      if (equipped) status = ' (已装备)';
      else if (owned) status = ' (已拥有)';
      
      return `${artifact.id}. ${artifact.name} - ${artifact.effect}${status}\n  等级: ${artifact.level} | 炼制消耗: ${artifact.cost}灵石 | 描述: ${artifact.desc}`;
    }).join('\n\n');
    
    await e.reply([
      '🔮 法宝系统',
      '================================',
      artifactList,
      '================================',
      '使用 #炼制法宝 [ID] 炼制法宝',
      '使用 #装备法宝 [ID] 装备法宝'
    ].join('\n'));
  }
  
  /** 查看丹药系统 */
  async viewPillsSystem(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    const pillList = this.pills.map(pill => {
      const count = user.pills[pill.id] || 0;
      return `${pill.id}. ${pill.name} ★${pill.quality} - ${pill.desc}\n  效果: ${pill.effect > 0 ? `+${pill.effect}修为` : pill.id === 8 ? '提升灵根资质' : '保命'} | 拥有: ${count}个 | 炼制消耗: ${pill.cost}灵石`;
    }).join('\n\n');
    
    await e.reply([
      '💊 丹药系统',
      '================================',
      pillList,
      '================================',
      '使用 #炼丹 [丹药ID] 炼制丹药',
      '使用 #服用丹药 [丹药ID] 使用丹药'
    ].join('\n'));
  }
  
  /** 查看功法系统 */
  async viewArtsSystem(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    const artList = this.arts.map(art => {
      const learned = user.arts.includes(art.id);
      return `${art.id}. ${art.name} - ${art.effect}\n  境界: ${art.level}级 | 描述: ${art.desc}${learned ? ' (已领悟)' : ''}`;
    }).join('\n\n');
    
    await e.reply([
      '📜 功法系统',
      '================================',
      artList,
      '================================',
      '使用 #领悟功法 尝试领悟新功法'
    ].join('\n'));
  }
  
  /** 查看灵根系统 */
  async viewSpiritRootsSystem(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    const userSpiritRoot = this.spiritRoots[user.spiritRoot];
    
    const spiritRootList = this.spiritRoots.map((root, index) => {
      const isCurrent = index === user.spiritRoot;
      return `${index}. ${root.name}${isCurrent ? ' (当前)' : ''}\n  修炼效率: ×${root.expRate} | 炼丹加成: ×${root.alchemy} | 突破加成: ×${root.breakthrough} | 气运加成: +${root.luck} | 描述: ${root.desc}`;
    }).join('\n\n');
    
    await e.reply([
      '🌱 灵根系统',
      '================================',
      `当前灵根: ${userSpiritRoot.name}`,
      '--------------------------------',
      spiritRootList,
      '================================',
      '使用 #灵根测试 测试你的灵根资质',
      '使用太虚神丹可以提升灵根品质'
    ].join('\n'));
  }
  
  /** 查看天劫系统 */
  async viewTribulationSystem(e) {
    const tribulationList = this.tribulationTypes.map(t => 
      `⚡ ${t.name} (${t.level})\n  描述: ${t.desc}\n  伤害: ${t.damage}%生命值`
    ).join('\n\n');
    
    await e.reply([
      '🌩️ 天劫系统',
      '================================',
      '修仙之路，逆天而行，每至大境界圆满需渡天劫',
      '渡劫成功则飞升仙界，失败则身死道消或境界跌落',
      '--------------------------------',
      tribulationList,
      '================================',
      '使用 #渡劫准备 查看当前渡劫准备情况',
      '使用 #渡劫 尝试渡劫飞升'
    ].join('\n'));
  }
  
  /** 查看宗门列表 */
  async viewSectsList(e) {
    const sects = this.sectData.getAll();
    
    if (Object.keys(sects).length === 0) {
      return e.reply('❌ 尚无宗门创建');
    }
    
    const sectList = Object.values(sects).map(sect => 
      `🏯 ${sect.name}\n  等级: ${sect.level} | 声望: ${sect.prestige}\n  宗主: ${sect.leaderName} | 成员: ${sect.members.length}人`
    ).join('\n\n');
    
    await e.reply([
      '🏯 宗门列表',
      '================================',
      sectList,
      '================================',
      '使用 #加入宗门 [名称] 加入宗门'
    ].join('\n'));
  }
  
  /** 查看境界体系 */
  async viewRealmsSystem(e) {
    const userId = e.user_id;
    const user = this.getUserData(userId);
    
    const realmList = this.realms.map((realm, index) => {
      const isCurrent = index === user.realm;
      return `${index}. ${realm.name}${isCurrent ? ' (当前境界)' : ''}\n  修为要求: ${realm.exp > 0 ? realm.exp : '圆满'} | 描述: ${realm.desc}`;
    }).join('\n\n');
    
    await e.reply([
      '🌌 修仙境界体系',
      '================================',
      realmList,
      '================================',
      '使用 #修炼 提升修为',
      '使用 #突破 尝试突破境界'
    ].join('\n'));
  }
  
  /** 获取用户名称 */
  getUserName(userId) {
    // 实际实现中需要根据平台获取用户名称
    return `道友${userId.substr(-4)}`;
  }
}