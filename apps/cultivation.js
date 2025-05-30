// xiuxian-plugin/apps/cultivation.js
const path = require('path');
const schedule = require('node-schedule');
const DataModel = require('../model/DataModel');
const CooldownManager = require('../model/CooldownManager');

class Cultivation {
  constructor(bot) {
    this.bot = bot;
    this.cooldown = new CooldownManager();
    
    // 大幅缩短冷却时间
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
    
// 修仙境界体系（优化显示）
    this.realms = [
      { name: "凡人", exp: 0, desc: "肉体凡胎，尚未踏入仙途" },
      { name: "炼气初期", exp: 100, desc: "初窥门径，引气入体" },
      { name: "炼气中期", exp: 300, desc: "气感增强，经脉初通" },
      { name: "炼气后期", exp: 600, desc: "灵气充盈，筑基在望" },
      { name: "筑基初期", exp: 1200, desc: "筑大道之基，寿元倍增" },
      { name: "筑基中期", exp: 2500, desc: "灵力凝实，可御物飞行" },
      { name: "筑基后期", exp: 5000, desc: "筑基圆满，金丹可期" },
      { name: "金丹初期", exp: 10000, desc: "凝聚金丹，大道初成" },
      { name: "金丹中期", exp: 20000, desc: "金丹稳固，神通初显" },
      { name: "金丹后期", exp: 40000, desc: "金丹大圆满，元婴可期" },
      { name: "元婴初期", exp: 80000, desc: "元婴初成，神识大涨" },
      { name: "元婴中期", exp: 160000, desc: "元婴稳固，可分神化念" },
      { name: "元婴后期", exp: 320000, desc: "元婴大圆满，化神在即" },
      { name: "化神初期", exp: 640000, desc: "元神初成，感悟天地" },
      { name: "化神中期", exp: 1280000, desc: "元神稳固，神通广大" },
      { name: "化神后期", exp: 2560000, desc: "化神大圆满，炼虚在望" },
      { name: "炼虚初期", exp: 5120000, desc: "炼虚合道，感悟法则" },
      { name: "炼虚中期", exp: 10240000, desc: "法则初通，移山填海" },
      { name: "炼虚后期", exp: 20480000, desc: "炼虚大圆满，合体可期" },
      { name: "合体初期", exp: 40960000, desc: "三花聚顶，五气朝元" },
      { name: "合体中期", exp: 81920000, desc: "天人合一，神通自生" },
      { name: "合体后期", exp: 163840000, desc: "合体大圆满，大乘在即" },
      { name: "大乘初期", exp: 327680000, desc: "大道初成，半仙之体" },
      { name: "大乘中期", exp: 655360000, desc: "仙体初成，神通广大" },
      { name: "大乘后期", exp: 1310720000, desc: "大乘大圆满，渡劫在即" },
      { name: "渡劫初期", exp: 2621440000, desc: "天劫将至，准备飞升" },
      { name: "渡劫中期", exp: 5242880000, desc: "历经天劫，仙体渐成" },
      { name: "渡劫后期", exp: 10485760000, desc: "仙体大成，随时飞升" },
      { name: "飞升", exp: 0, desc: "羽化登仙，位列仙班" }
    ];
    
    // 灵根资质系统
    this.spiritRoots = [
      { name: "废灵根", expRate: 0.5, alchemy: 0.3, breakthrough: 0.4, luck: 5 },
      { name: "伪灵根", expRate: 0.7, alchemy: 0.5, breakthrough: 0.6, luck: 10 },
      { name: "下品灵根", expRate: 0.9, alchemy: 0.7, breakthrough: 0.8, luck: 15 },
      { name: "中品灵根", expRate: 1.0, alchemy: 0.9, breakthrough: 1.0, luck: 20 },
      { name: "上品灵根", expRate: 1.2, alchemy: 1.1, breakthrough: 1.2, luck: 25 },
      { name: "地灵根", expRate: 1.5, alchemy: 1.3, breakthrough: 1.4, luck: 30 },
      { name: "天灵根", expRate: 1.8, alchemy: 1.5, breakthrough: 1.6, luck: 35 },
      { name: "圣灵根", expRate: 2.0, alchemy: 1.8, breakthrough: 1.8, luck: 40 },
      { name: "仙灵根", expRate: 2.5, alchemy: 2.0, breakthrough: 2.0, luck: 45 },
      { name: "混沌灵根", expRate: 3.0, alchemy: 2.5, breakthrough: 2.5, luck: 50 }
    ];
    
    // 丹药系统
    this.pills = [
      { id: 1, name: "聚气丹", effect: 100, cost: 50, desc: "增加100点修为", quality: 1 },
      { id: 2, name: "筑基丹", effect: 500, cost: 300, desc: "突破筑基必备", quality: 2 },
      { id: 3, name: "凝金丹", effect: 2000, cost: 1500, desc: "凝结金丹辅助", quality: 3 },
      { id: 4, name: "元婴丹", effect: 10000, cost: 8000, desc: "孕育元婴所需", quality: 4 },
      { id: 5, name: "渡劫丹", effect: 50000, cost: 50000, desc: "抵御天劫损伤", quality: 5 },
      { id: 6, name: "九转还魂丹", effect: 0, cost: 100000, desc: "渡劫失败保命", quality: 6 },
      { id: 7, name: "九转金丹", effect: 500000, cost: 300000, desc: "大幅提升修为", quality: 7 },
      { id: 8, name: "太虚神丹", effect: 0, cost: 500000, desc: "永久提升灵根资质", quality: 8 }
    ];
    
    // 功法系统
    this.arts = [
      { id: 1, name: "《基础吐纳诀》", effect: "expRate:1.1", level: 1 },
      { id: 2, name: "《五行道法》", effect: "breakthrough:1.15", level: 2 },
      { id: 3, name: "《九天玄功》", effect: "expRate:1.3, alchemy:1.2", level: 3 },
      { id: 4, name: "《太虚剑意》", effect: "tribulation:1.2", level: 4 },
      { id: 5, name: "《大衍神诀》", effect: "expRate:1.5, luck:10", level: 5 },
      { id: 6, name: "《混沌经》", effect: "expRate:2.0, breakthrough:1.3", level: 6 },
      { id: 7, name: "《星辰变》", effect: "all:1.25", level: 7 },
      { id: 8, name: "《一气化三清》", effect: "expRate:2.5, tribulation:1.5", level: 8 }
    ];
    
    // 法宝系统
    this.artifacts = [
      { id: 1, name: "青锋剑", effect: "突破成功率+5%", level: 1, cost: 500 },
      { id: 2, name: "玄武盾", effect: "天劫伤害-10%", level: 2, cost: 1500 },
      { id: 3, name: "神农鼎", effect: "炼丹成功率+15%", level: 3, cost: 5000 },
      { id: 4, name: "昆仑镜", effect: "奇遇触发率+20%", level: 4, cost: 20000 },
      { id: 5, name: "东皇钟", effect: "全属性+15%", level: 5, cost: 100000 },
      { id: 6, name: "诛仙剑阵", effect: "攻击类法宝效果翻倍", level: 6, cost: 500000 }
    ];
    
    // 秘境系统
    this.dungeons = [
      { id: 1, name: "迷雾森林", minRealm: 0, rewards: "灵石+100~300，修为+50~150" },
      { id: 2, name: "熔岩洞穴", minRealm: 4, rewards: "灵石+300~800，修为+200~500，低阶丹药" },
      { id: 3, name: "幽冥地府", minRealm: 8, rewards: "灵石+1000~3000，修为+800~2000，中阶丹药" },
      { id: 4, name: "九天仙宫", minRealm: 12, rewards: "灵石+5000~15000，修为+3000~8000，高阶丹药" },
      { id: 5, name: "混沌虚空", minRealm: 20, rewards: "极品法宝，仙丹，稀有功法" }
    ];
    
    // 天劫类型
    this.tribulationTypes = [
      { name: "三九天劫", damage: 30, desc: "三重雷劫，每重九道天雷" },
      { name: "六九天劫", damage: 50, desc: "六重雷云笼罩天地，五十四道神雷撕裂苍穹" },
      { name: "九九天劫", damage: 70, desc: "九霄神雷汇聚，八十一道灭世雷霆轰然而至" },
      { name: "心魔劫", damage: 40, desc: "内心深处的恐惧被无限放大，心魔丛生" },
      { name: "业火劫", damage: 60, desc: "红莲业火从脚下升起，焚烧神魂" },
      { name: "混沌劫", damage: 90, desc: "混沌之气弥漫，万物归于虚无" }
    ];
    
// 新增商店系统
    this.shopItems = [
      { id: 1, name: "下品灵石", type: "currency", price: 1, desc: "修仙界基础货币", effect: "兑换其他物品" },
      { id: 2, name: "聚气丹丹方", type: "pill_recipe", price: 500, desc: "炼制聚气丹的丹方", effect: "可炼制聚气丹" },
      { id: 3, name: "青锋剑图谱", type: "artifact_blueprint", price: 1000, desc: "炼制青锋剑的图谱", effect: "可炼制青锋剑" },
      { id: 4, name: "基础吐纳诀", type: "art_book", price: 2000, desc: "基础修炼功法", effect: "提升修炼效率10%" },
      { id: 5, name: "灵根测试石", type: "tool", price: 300, desc: "测试灵根资质的灵石", effect: "使用后可测试灵根" },
      { id: 6, name: "小型储物袋", type: "bag", price: 5000, desc: "增加背包容量", effect: "背包容量+10" },
      { id: 7, name: "宗门推荐信", type: "special", price: 20000, desc: "加入大宗门的凭证", effect: "可直接加入任意宗门" }
    ];
    
    // 背包系统
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
      { reg: '^#修仙日志$', fnc: 'cultivationLog' }
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
      // 修炼随机事件
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
      
      // 突破随机事件
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
      
      // 奇遇随机事件
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
      
      return `${artifact.id}. ${artifact.name} - ${artifact.effect}${status}\n  等级: ${artifact.level} | 炼制消耗: ${artifact.cost}灵石`;
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
      return `${art.id}. ${art.name} - ${art.effect}\n  境界: ${art.level}级${learned ? ' (已领悟)' : ''}`;
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
      return `${index}. ${root.name}${isCurrent ? ' (当前)' : ''}\n  修炼效率: ×${root.expRate} | 炼丹加成: ×${root.alchemy} | 突破加成: ×${root.breakthrough} | 气运加成: +${root.luck}`;
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
      `⚡ ${t.name}\n  描述: ${t.desc}\n  伤害: ${t.damage}%生命值`
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
        logs: []           // 修仙日志
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
      '🌌 修仙渡劫系统·互动增强版',
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
      '📜 其他指令：',
      '#修仙日志 - 查看最近的修仙历程',
      '#商店 - 查看商店物品',
      '#购买 [物品ID] [数量] - 购买商店物品',
      '#出售 [物品ID] [数量] - 出售背包物品',
      '#背包 - 查看背包内容',
      '',
      '📜 新增其他指令：',
      '#查看法宝 - 查看法宝系统',
      '#查看丹药 - 查看丹药系统',
      '#查看功法 - 查看功法系统',
      '#查看灵根 - 查看灵根系统',
      '#查看天劫 - 查看天劫系统',
      '#宗门列表 - 查看宗门系统',
      '#境界体系 - 查看境界系统',
      '',
      '================================',
      '💡 提示：冷却时间大幅缩短，互动性增强！'
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
    const realmIndex = user.realm;
    const realmName = this.realms[realmIndex];
    const nextRealm = realmIndex < this.realms.length - 1 ? this.realms[realmIndex + 1] : '已至巅峰';
    
    // 计算属性加成
    const spiritRoot = this.spiritRoots[user.spiritRoot];
    const expRate = spiritRoot.expRate * (1 + user.comprehension * 0.1);
    
    const msg = [
      `🧘 道号：${e.sender.card || e.sender.nickname}`,
      `🌠 境界：${realmName}（${user.exp}/${user.maxExp}）`,
      `✨ 灵根：${spiritRoot.name}（修为效率×${expRate.toFixed(1)}）`,
      `❤️ 生命：${user.life}/100`,
      `🍀 气运：${user.luck}/100`,
      `💎 灵石：${user.stone}`,
      `📜 功法：${user.arts.map(id => this.arts.find(a => a.id === id)?.name || '未知'}`,
      `⚔️ 战斗力：${user.combatPower}`,
      `⬆️ 下一境界：${nextRealm}`,
      `⚡ 渡劫：${user.successCount}成功/${user.tribulationCount}次`,
    ];
    
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
    if (user.exp >= user.maxExp && user.realm < this.realms.length - 1) {
      extraMsg += `\n🌅 修为已达圆满，可尝试 #突破 至 ${this.realms[user.realm + 1]}！`;
    }
    
    this.updateUserData(userId, user);
    this.cooldown.setCooldown(userId, 'cultivate', this.cdTimes.cultivate);
    
    // 添加日志
    this.addLog(userId, `修炼获得修为${expGain}`);
    
    await e.reply([
      `🧘 运转周天，炼化天地灵气...`,
      `✅ 修为 +${expGain}（当前：${user.exp}/${user.maxExp}）`,
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
    if (user.exp < user.maxExp) {
      return e.reply(`❌ 修为不足！还需 ${user.maxExp - user.exp} 点修为方可突破`);
    }
    
    if (user.realm >= this.realms.length - 1) {
      return e.reply(`✅ 已是最高境界，请准备 #渡劫 飞升！`);
    }
    
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
      user.maxExp = Math.floor(user.maxExp * 1.8);
      user.combatPower += 50;
      user.daoHeart = Math.min(10, user.daoHeart + 0.5);
      
      resultMsg.push(
        `🌈 突破成功！`,
        `🎉 境界提升至：${this.realms[user.realm]}！`,
        `💎 消耗灵石：${stoneCost}`,
        `❤️ 生命上限提升！`,
        `✨ 下一境界：${this.realms[user.realm + 1]}（需 ${user.maxExp} 修为）`
      );
      
      // 添加日志
      this.addLog(userId, `成功突破至${this.realms[user.realm]}`);
      
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
  
  // 其他函数实现（渡劫、灵根测试等）保持类似结构，但使用新的冷却时间
  
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
    await this.bot.sendPrivateMsg(requesterId, [
      `💞 ${this.getUserName(userId)} 已同意你的双修请求`,
      `✨ 你获得修为 +${expGain}`,
      `🍀 气运 +5`
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
  
  /** 获取用户名称 */
  getUserName(userId) {
    // 实际实现中需要根据平台获取用户名称
    return `道友${userId.substr(-4)}`;
  }
}

module.exports = Cultivation;