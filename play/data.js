const ATTRS = {
 fire: {
  name: "火",
  main: "#e8452c",
  deep: "#8e1a0e",
  glow: "#ffb35c"
 },
 water: {
  name: "水",
  main: "#2f8fe0",
  deep: "#123f7a",
  glow: "#8fe3ff"
 },
 wind: {
  name: "風",
  main: "#3fb556",
  deep: "#17602a",
  glow: "#c6f58a"
 },
 earth: {
  name: "土",
  main: "#c27a2c",
  deep: "#5e3510",
  glow: "#ffd27a"
 },
 light: {
  name: "光",
  main: "#e9b820",
  deep: "#8a6400",
  glow: "#fff3a6"
 },
 dark: {
  name: "闇",
  main: "#7a4bc4",
  deep: "#33175e",
  glow: "#d6b3ff"
 }
};

const KEYWORDS = {
 "連鎖": "このターン2枚目以降に使うと、追加の効果",
 "咆哮": "（ほうこう）最大MPが5以上なら、追加の効果",
 "溜め": "手札にある間、魔法を使うたびに強くなる",
 "燃焼": "敵のターンの始めに、その数だけダメージ。そのあと1減る",
 "弱体": "その間、敵の攻撃が3割減る",
 "ひび": "その間、敵が受けるダメージが1.5倍（よろいにひびが入った状態）",
 "反撃": "このターン、あなたか召喚獣が攻撃を受けるたび、その数だけ敵にダメージ",
 "守護": "体力が半分以上のあいだ、敵の攻撃を先に受ける（自分の防御で守れる）",
 "突進": "出たターンから攻撃する（ふつうは次のターンから）",
 "2回攻撃": "1ターンに2回攻撃する",
 "相棒": "冒険のはじめにえらんだ仲間。毎回の戦闘で最初から場にいる",
 "進化": "同じモンスターが2枚そろうと、1枚の進化形になる",
 "貫通": "敵の防御を無視する",
 "消滅": "使うと、この戦闘ではもう出てこない",
 "召喚時": "場に出たときの効果",
 "破壊時": "やられたときの効果"
};

const CARDS = {
 tackle: {
  name: "たいあたり",
  attr: "earth",
  cost: 1,
  kind: "攻撃",
  rarity: 1,
  art: "icon_tackle",
  fx: [ {
   op: "dmg",
   n: 3,
   g: .5
  } ],
  combo: [ {
   op: "dmg",
   n: 2
  } ],
  learn: {
   3: [ {
    op: "block",
    n: 2
   } ]
  }
 },
 gust: {
  name: "つむじかぜ",
  attr: "wind",
  cost: 2,
  kind: "攻撃",
  rarity: 1,
  art: "icon_gust",
  fx: [ {
   op: "dmg",
   n: 2,
   times: 2,
   g: .5
  } ],
  combo: [ {
   op: "dmg",
   n: 2,
   g: .5
  } ],
  learn: {
   5: [ {
    op: "draw",
    n: 1
   } ]
  }
 },
 fireball: {
  name: "ひのたま",
  attr: "fire",
  cost: 3,
  kind: "攻撃",
  rarity: 1,
  art: "icon_fireball",
  fx: [ {
   op: "dmg",
   n: 5,
   g: .5
  }, {
   op: "burn",
   n: 2,
   g: .5
  } ],
  awaken: [ {
   op: "burn",
   n: 2
  } ]
 },
 charge: {
  name: "ちからため",
  attr: "earth",
  cost: 2,
  kind: "攻撃",
  rarity: 1,
  art: "icon_charge",
  fx: [ {
   op: "dmg",
   n: 4,
   g: .5,
   b: 3
  } ],
  boost: true
 },
 blade: {
  name: "ほしくだき",
  attr: "light",
  cost: 2,
  kind: "攻撃",
  rarity: 2,
  art: "icon_blade",
  fx: [ {
   op: "shatter",
   n: 6,
   g: 1
  } ]
 },
 pursuit: {
  name: "とどめのいちげき",
  attr: "dark",
  cost: 3,
  kind: "攻撃",
  rarity: 2,
  art: "icon_pursuit",
  fx: [ {
   op: "execute",
   n: 5,
   g: 1
  } ]
 },
 flurry: {
  name: "みだれうち",
  attr: "wind",
  cost: 3,
  kind: "攻撃",
  rarity: 2,
  art: "icon_flurry",
  fx: [ {
   op: "flurry",
   n: 2,
   g: .5
  } ]
 },
 quake: {
  name: "だいちのいかり",
  attr: "earth",
  cost: 5,
  kind: "攻撃",
  rarity: 2,
  art: "icon_quake",
  fx: [ {
   op: "dmg",
   n: 11,
   g: 1.5
  } ],
  awaken: [ {
   op: "vuln",
   n: 2
  } ]
 },
 fang: {
  name: "りゅうのきば",
  attr: "fire",
  cost: 3,
  kind: "攻撃",
  rarity: 3,
  art: "icon_fang",
  fx: [ {
   op: "dmg",
   n: 8,
   g: 1
  } ],
  combo: [ {
   op: "dmg",
   n: 6,
   g: 1
  } ]
 },
 tempest: {
  name: "あらしのまい",
  attr: "wind",
  cost: 4,
  kind: "攻撃",
  rarity: 3,
  art: "icon_tempest",
  fx: [ {
   op: "dmg",
   n: 2,
   times: 6,
   g: .34
  } ],
  awaken: [ {
   op: "weak",
   n: 2
  } ]
 },
 inferno: {
  name: "ごうかえん",
  attr: "fire",
  cost: 4,
  kind: "攻撃",
  rarity: 3,
  art: "icon_inferno",
  fx: [ {
   op: "burn",
   n: 2,
   g: .5
  }, {
   op: "ignite"
  } ],
  exhaust: true
 },
 guard: {
  name: "まもる",
  attr: "water",
  cost: 1,
  kind: "防御",
  rarity: 1,
  art: "icon_guard",
  fx: [ {
   op: "block",
   n: 4,
   g: .5
  } ],
  combo: [ {
   op: "draw",
   n: 1
  } ],
  awaken: [ {
   op: "block",
   n: 3
  } ]
 },
 wall: {
  name: "いわのかべ",
  attr: "earth",
  cost: 3,
  kind: "防御",
  rarity: 1,
  art: "icon_wall",
  fx: [ {
   op: "block",
   n: 11,
   g: 1
  }, {
   op: "rally",
   atk: 0,
   hp: 2
  } ]
 },
 aegis: {
  name: "せいなるたて",
  attr: "light",
  cost: 3,
  kind: "防御",
  rarity: 3,
  art: "icon_aegis",
  fx: [ {
   op: "block",
   n: 13,
   g: 1
  }, {
   op: "thorns",
   n: 4,
   g: .5
  }, {
   op: "rally",
   atk: 0,
   hp: 3
  } ]
 },
 spikes: {
  name: "とげのよろい",
  attr: "earth",
  cost: 1,
  kind: "防御",
  rarity: 1,
  art: "icon_spikes",
  fx: [ {
   op: "block",
   n: 4,
   g: .5
  }, {
   op: "thorns",
   n: 3,
   g: .5
  } ]
 },
 starguard: {
  name: "ほしのまもり",
  attr: "light",
  cost: 2,
  kind: "防御",
  rarity: 2,
  art: "icon_starguard",
  fx: [ {
   op: "block",
   n: 6,
   g: .5,
   b: 3
  }, {
   op: "thorns",
   n: 1,
   b: 1
  } ],
  boost: true
 },
 mirror: {
  name: "かがみのたて",
  attr: "water",
  cost: 2,
  kind: "防御",
  rarity: 2,
  art: "icon_mirror",
  fx: [ {
   op: "block",
   n: 5,
   g: .5
  }, {
   op: "weak",
   n: 1
  } ],
  learn: {
   3: [ {
    op: "weak",
    n: 1
   } ]
  }
 },
 counter: {
  name: "はんげきのかまえ",
  attr: "fire",
  cost: 2,
  kind: "防御",
  rarity: 2,
  art: "icon_counter",
  fx: [ {
   op: "block",
   n: 4,
   g: .5
  }, {
   op: "thorns",
   n: 3,
   g: .5
  } ]
 },
 spark: {
  name: "ひらめき",
  attr: "light",
  cost: 0,
  kind: "魔法",
  rarity: 1,
  art: "icon_spark",
  fx: [ {
   op: "draw",
   n: 1
  } ],
  learn: {
   3: [ {
    op: "mp",
    n: 1
   } ]
  }
 },
 drop: {
  name: "ひかりのしずく",
  attr: "light",
  cost: 2,
  kind: "魔法",
  rarity: 1,
  art: "icon_drop",
  fx: [ {
   op: "heal",
   n: 6,
   g: 1
  }, {
   op: "rally",
   atk: 0,
   hp: 3
  }, {
   op: "draw",
   n: 1
  } ]
 },
 shadow: {
  name: "かげぬい",
  attr: "dark",
  cost: 2,
  kind: "魔法",
  rarity: 1,
  art: "icon_shadow",
  fx: [ {
   op: "dmg",
   n: 3,
   g: .5
  }, {
   op: "weak",
   n: 2
  } ],
  awaken: [ {
   op: "vuln",
   n: 1
  } ]
 },
 hex: {
  name: "のろいのしるし",
  attr: "dark",
  cost: 1,
  kind: "魔法",
  rarity: 1,
  art: "icon_hex",
  fx: [ {
   op: "vuln",
   n: 2
  } ],
  learn: {
   3: [ {
    op: "draw",
    n: 1
   } ]
  }
 },
 thunder: {
  name: "いかずち",
  attr: "light",
  cost: 3,
  kind: "魔法",
  rarity: 2,
  art: "icon_thunder",
  fx: [ {
   op: "pierce",
   n: 5,
   g: 1,
   b: 2
  } ],
  boost: true,
  awaken: [ {
   op: "draw",
   n: 1
  } ]
 },
 spring: {
  name: "まりょくのいずみ",
  attr: "water",
  cost: 1,
  kind: "魔法",
  rarity: 2,
  art: "icon_spring",
  fx: [ {
   op: "mp",
   n: 2
  }, {
   op: "draw",
   n: 1
  } ],
  exhaust: true,
  learn: {
   5: [ {
    op: "mp",
    n: 1
   } ]
  }
 },
 warcry: {
  name: "ときのこえ",
  attr: "fire",
  cost: 2,
  kind: "魔法",
  rarity: 2,
  art: "icon_warcry",
  fx: [ {
   op: "rally",
   atk: 2,
   hp: 0
  }, {
   op: "draw",
   n: 1
  } ],
  learn: {
   3: [ {
    op: "rally",
    atk: 1,
    hp: 1
   } ]
  }
 },
 hymn: {
  name: "いのちのうた",
  attr: "light",
  cost: 3,
  kind: "魔法",
  rarity: 3,
  art: "icon_hymn",
  fx: [ {
   op: "heal",
   n: 10,
   g: 1
  }, {
   op: "rally",
   atk: 1,
   hp: 3
  }, {
   op: "draw",
   n: 2
  } ]
 },
 medit: {
  name: "めいそう",
  attr: "water",
  cost: 4,
  kind: "魔法",
  rarity: 2,
  art: "icon_medit",
  fx: [ {
   op: "heal",
   n: 4,
   b: 2
  }, {
   op: "draw",
   n: 2
  } ],
  boost: true,
  boostCost: 1
 },
 meteor: {
  name: "ほしふり",
  attr: "dark",
  cost: 6,
  kind: "魔法",
  rarity: 3,
  art: "icon_meteor",
  fx: [ {
   op: "dmg",
   n: 3,
   times: 5,
   g: .5
  } ],
  boost: true,
  boostCost: 1
 },
 g_slime: {
  name: "スライム",
  attr: "water",
  cost: 1,
  kind: "召喚獣",
  rarity: 1,
  art: "mon_slime_full",
  evolve: "e_slime",
  unit: {
   atk: 2,
   hp: 8,
   ward: true,
   onDeath: [ {
    op: "block",
    n: 6
   } ],
   onTurnEnd: [ {
    op: "heal",
    n: 1
   } ]
  },
  unitGrow: {
   atk: .34,
   hp: 2
  },
  learn: {
   3: {
    atk: 1
   },
   5: {
    hp: 4
   }
  }
 },
 g_bird: {
  name: "つむじどり",
  attr: "wind",
  cost: 2,
  kind: "召喚獣",
  rarity: 1,
  art: "mon_bird_full",
  evolve: "e_bird",
  unit: {
   atk: 4,
   hp: 4,
   rush: true
  },
  unitGrow: {
   atk: .34,
   hp: 1
  },
  learn: {
   3: {
    double: true
   },
   5: {
    atk: 1
   }
  }
 },
 g_knight: {
  name: "ぎんの騎士",
  attr: "light",
  cost: 3,
  kind: "召喚獣",
  rarity: 1,
  art: "mon_knight_full",
  evolve: "e_knight",
  unit: {
   atk: 2,
   hp: 9,
   ward: true,
   thorns: 1
  },
  unitGrow: {
   atk: .5,
   hp: 1
  },
  learn: {
   3: {
    thorns: 2
   },
   5: {
    onTurnEnd: [ {
     op: "block",
     n: 2
    } ]
   }
  }
 },
 g_ghost: {
  name: "きりの魔女",
  attr: "dark",
  cost: 3,
  kind: "召喚獣",
  rarity: 2,
  art: "mon_ghost_full",
  evolve: "e_ghost",
  unit: {
   atk: 3,
   hp: 4,
   onAttack: [ {
    op: "vuln",
    n: 1
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 1
  },
  learn: {
   3: {
    onAttack: [ {
     op: "burn",
     n: 1
    } ]
   },
   5: {
    atk: 1
   }
  }
 },
 g_golem: {
  name: "いわもりゴーレム",
  attr: "earth",
  cost: 5,
  kind: "召喚獣",
  rarity: 2,
  art: "mon_golem_full",
  evolve: "e_golem",
  unit: {
   atk: 2,
   hp: 8,
   ward: true,
   onTurnEnd: [ {
    op: "block",
    n: 1
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 2
  },
  learn: {
   3: {
    thorns: 2
   },
   5: {
    hp: 6
   }
  }
 },
 g_wizard: {
  name: "ほしの魔法使い",
  attr: "dark",
  cost: 5,
  kind: "召喚獣",
  rarity: 3,
  art: "mon_wizard_full",
  evolve: "e_wizard",
  unit: {
   atk: 3,
   hp: 10,
   onSpell: [ {
    op: "pierce",
    n: 5
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 1
  },
  learn: {
   3: {
    onSummon: [ {
     op: "draw",
     n: 1
    } ]
   },
   5: {
    onSpell: [ {
     op: "pierce",
     n: 1
    } ]
   }
  }
 },
 g_dragon: {
  name: "こどもドラゴン",
  attr: "fire",
  cost: 6,
  kind: "召喚獣",
  rarity: 3,
  art: "mon_dragon_full",
  evolve: "e_dragon",
  unit: {
   atk: 6,
   hp: 8,
   rush: true,
   onSummon: [ {
    op: "burn",
    n: 4
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 2
  },
  learn: {
   3: {
    onAttack: [ {
     op: "burn",
     n: 1
    } ]
   },
   5: {
    atk: 2
   }
  }
 },
 e_slime: {
  name: "キングスライム",
  attr: "water",
  cost: 2,
  kind: "召喚獣",
  rarity: 0,
  evolved: true,
  base: "g_slime",
  art: "mon_e_slime_full",
  unit: {
   atk: 2,
   hp: 12,
   ward: true,
   onDeath: [ {
    op: "block",
    n: 8
   } ],
   onTurnEnd: [ {
    op: "heal",
    n: 2
   } ]
  },
  unitGrow: {
   atk: .34,
   hp: 2
  }
 },
 e_bird: {
  name: "ストームイーグル",
  attr: "wind",
  cost: 3,
  kind: "召喚獣",
  rarity: 0,
  evolved: true,
  base: "g_bird",
  art: "mon_e_bird_full",
  unit: {
   atk: 5,
   hp: 7,
   rush: true,
   double: true
  },
  unitGrow: {
   atk: .5,
   hp: 1
  }
 },
 e_knight: {
  name: "せいぎの聖騎士",
  attr: "light",
  cost: 4,
  kind: "召喚獣",
  rarity: 0,
  evolved: true,
  base: "g_knight",
  art: "mon_e_knight_full",
  unit: {
   atk: 3,
   hp: 11,
   ward: true,
   thorns: 2,
   onTurnEnd: [ {
    op: "block",
    n: 2
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 1
  }
 },
 e_ghost: {
  name: "まよいの大魔女",
  attr: "dark",
  cost: 4,
  kind: "召喚獣",
  rarity: 0,
  evolved: true,
  base: "g_ghost",
  art: "mon_e_ghost_full",
  unit: {
   atk: 5,
   hp: 7,
   onAttack: [ {
    op: "vuln",
    n: 1
   }, {
    op: "burn",
    n: 1
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 1
  }
 },
 e_golem: {
  name: "だいちの巨神",
  attr: "earth",
  cost: 6,
  kind: "召喚獣",
  rarity: 0,
  evolved: true,
  base: "g_golem",
  art: "mon_e_golem_full",
  unit: {
   atk: 3,
   hp: 10,
   ward: true,
   thorns: 1,
   onTurnEnd: [ {
    op: "block",
    n: 2
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 2
  }
 },
 e_wizard: {
  name: "ほしよみの大賢者",
  attr: "dark",
  cost: 6,
  kind: "召喚獣",
  rarity: 0,
  evolved: true,
  base: "g_wizard",
  art: "mon_e_wizard_full",
  unit: {
   atk: 6,
   hp: 16,
   onSpell: [ {
    op: "pierce",
    n: 10
   } ],
   onSummon: [ {
    op: "mp",
    n: 1
   }, {
    op: "draw",
    n: 2
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 1
  }
 },
 e_dragon: {
  name: "ほむらの竜王",
  attr: "fire",
  cost: 7,
  kind: "召喚獣",
  rarity: 0,
  evolved: true,
  base: "g_dragon",
  art: "mon_e_dragon_full",
  unit: {
   atk: 9,
   hp: 14,
   rush: true,
   onSummon: [ {
    op: "burn",
    n: 6
   } ],
   onAttack: [ {
    op: "burn",
    n: 2
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 2
  }
 },
 g_mush: {
  name: "ねむりキノコ",
  attr: "earth",
  cost: 2,
  kind: "召喚獣",
  rarity: 1,
  art: "mon_mush_full",
  unit: {
   atk: 1,
   hp: 6,
   ward: true,
   onAttack: [ {
    op: "weak",
    n: 1
   } ],
   onTurnEnd: [ {
    op: "heal",
    n: 1
   } ]
  },
  unitGrow: {
   atk: .34,
   hp: 1
  }
 },
 g_frog: {
  name: "みずべガエル",
  attr: "water",
  cost: 2,
  kind: "召喚獣",
  rarity: 1,
  art: "mon_frog_full",
  unit: {
   atk: 2,
   hp: 5,
   onSummon: [ {
    op: "block",
    n: 4
   } ]
  },
  unitGrow: {
   atk: .34,
   hp: 1
  }
 },
 g_bat: {
  name: "ほらあなコウモリ",
  attr: "dark",
  cost: 2,
  kind: "召喚獣",
  rarity: 1,
  art: "mon_bat_full",
  unit: {
   atk: 2,
   hp: 3,
   rush: true,
   onAttack: [ {
    op: "heal",
    n: 1
   } ]
  },
  unitGrow: {
   atk: .34,
   hp: 1
  }
 },
 g_treant: {
  name: "もりのぬし",
  attr: "wind",
  cost: 4,
  kind: "召喚獣",
  rarity: 2,
  art: "mon_treant_full",
  unit: {
   atk: 2,
   hp: 12,
   ward: true,
   onTurnEnd: [ {
    op: "heal",
    n: 2
   } ]
  },
  unitGrow: {
   atk: .34,
   hp: 2
  }
 },
 g_serpent: {
  name: "みずうみの大へび",
  attr: "water",
  cost: 4,
  kind: "召喚獣",
  rarity: 2,
  art: "mon_serpent_full",
  unit: {
   atk: 4,
   hp: 7,
   onAttack: [ {
    op: "vuln",
    n: 1
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 1
  }
 },
 g_gargoyle: {
  name: "いしのガーゴイル",
  attr: "earth",
  cost: 4,
  kind: "召喚獣",
  rarity: 2,
  art: "mon_gargoyle_full",
  unit: {
   atk: 3,
   hp: 9,
   ward: true,
   thorns: 2
  },
  unitGrow: {
   atk: .5,
   hp: 1
  }
 },
 g_book: {
  name: "まどうしょ",
  attr: "light",
  cost: 3,
  kind: "召喚獣",
  rarity: 2,
  art: "mon_book_full",
  unit: {
   atk: 2,
   hp: 4,
   onSummon: [ {
    op: "draw",
    n: 1
   } ],
   onSpell: [ {
    op: "pierce",
    n: 1
   } ]
  },
  unitGrow: {
   atk: .34,
   hp: 1
  }
 },
 g_imp: {
  name: "ほのおのこあくま",
  attr: "fire",
  cost: 3,
  kind: "召喚獣",
  rarity: 1,
  art: "mon_imp_full",
  unit: {
   atk: 3,
   hp: 4,
   rush: true,
   onAttack: [ {
    op: "burn",
    n: 1
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 1
  }
 },
 b_witch: {
  name: "やみの魔女王",
  attr: "dark",
  cost: 5,
  kind: "召喚獣",
  rarity: 3,
  art: "mon_witch_full",
  unit: {
   atk: 4,
   hp: 8,
   onSummon: [ {
    op: "vuln",
    n: 2
   } ],
   onAttack: [ {
    op: "weak",
    n: 1
   }, {
    op: "burn",
    n: 2
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 1
  }
 },
 b_titan: {
  name: "こおりの巨神",
  attr: "water",
  cost: 6,
  kind: "召喚獣",
  rarity: 3,
  art: "mon_titan_full",
  unit: {
   atk: 5,
   hp: 16,
   ward: true,
   thorns: 3,
   onTurnEnd: [ {
    op: "block",
    n: 4
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 2
  }
 },
 b_abyss: {
  name: "くろの騎士王",
  attr: "dark",
  cost: 6,
  kind: "召喚獣",
  rarity: 3,
  art: "mon_abyss_full",
  unit: {
   atk: 7,
   hp: 12,
   rush: true,
   onSummon: [ {
    op: "pierce",
    n: 6
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 2
  }
 },
 b_maou: {
  name: "よるの大魔王",
  attr: "dark",
  cost: 7,
  kind: "召喚獣",
  rarity: 4,
  art: "mon_maou_full",
  unit: {
   atk: 8,
   hp: 16,
   rush: true,
   double: true,
   onSummon: [ {
    op: "burn",
    n: 6
   }, {
    op: "vuln",
    n: 2
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 2
  }
 },
 l_phoenix: {
  name: "ふしちょう",
  attr: "fire",
  cost: 5,
  kind: "召喚獣",
  rarity: 4,
  packOnly: true,
  art: "mon_phoenix_full",
  unit: {
   atk: 4,
   hp: 6,
   rush: true,
   onAttack: [ {
    op: "burn",
    n: 2
   } ],
   onDeath: [ {
    op: "heal",
    n: 10
   }, {
    op: "burn",
    n: 5
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 1
  }
 },
 l_whale: {
  name: "そらくじら",
  attr: "water",
  cost: 5,
  kind: "召喚獣",
  rarity: 4,
  packOnly: true,
  art: "mon_whale_full",
  unit: {
   atk: 2,
   hp: 16,
   ward: true,
   onTurnEnd: [ {
    op: "block",
    n: 4
   }, {
    op: "heal",
    n: 2
   } ]
  },
  unitGrow: {
   atk: .34,
   hp: 2
  }
 },
 l_unicorn: {
  name: "ひかりのユニコーン",
  attr: "light",
  cost: 4,
  kind: "召喚獣",
  rarity: 4,
  packOnly: true,
  art: "mon_unicorn_full",
  unit: {
   atk: 3,
   hp: 7,
   onSummon: [ {
    op: "rally",
    atk: 1,
    hp: 2
   } ],
   onTurnEnd: [ {
    op: "heal",
    n: 2
   } ]
  },
  unitGrow: {
   atk: .5,
   hp: 1
  }
 },
 curse: {
  name: "のろい",
  attr: "dark",
  cost: 1,
  kind: "魔法",
  rarity: 0,
  art: "icon_curse",
  fx: [],
  exhaust: true,
  junk: true
 }
};

const STARTER_DECK = [ "tackle", "tackle", "tackle", "gust", "guard", "guard", "guard", "shadow", "fireball" ];

const DECK_SIZE = 15;

const DECK_MAX_COPIES = 3;

const START_COLLECTION = {
 tackle: 3,
 gust: 2,
 fireball: 2,
 guard: 3,
 wall: 1,
 spark: 1,
 drop: 1,
 shadow: 1,
 hex: 1
};

const PACK = {
 size: 5,
 dupExp: 3,
 weight: {
  1: 10,
  2: 4,
  3: 1
 },
 legend: .08,
 pity: 12,
 price: 30,
 bonus: (floor, won) => floor * 5 + (won ? 50 : 0),
 startGold: 0,
 freePacks: 1
};

const STARTERS = [ "g_slime", "g_bird", "g_knight" ];

const RIVAL = {
 g_slime: {
  floors: [ 2 ],
  kinFrom: 1
 },
 g_golem: {
  floors: [ 4, 5 ]
 },
 g_ghost: {
  floors: [ 4, 5 ]
 },
 g_bird: {
  floors: [ 5, 6 ],
  elite: true
 },
 g_knight: {
  floors: [ 6, 7 ],
  elite: true
 },
 g_wizard: {
  floors: [ 6, 7 ]
 }
};

const MONSTERS = [ "g_slime", "g_bird", "g_knight", "g_ghost", "g_golem", "g_wizard", "g_dragon" ];

const LEGENDS = [ "l_phoenix", "l_whale", "l_unicorn" ];

const REWARD_POOL = Object.keys(CARDS).filter(k => CARDS[k].rarity > 0 && !CARDS[k].unit);

const RARITY_WEIGHT = {
 1: 6,
 2: 3,
 3: 1
};

const ENEMIES = {
 slime: {
  name: "スライム",
  attr: "water",
  hp: 17,
  art: "mon_slime",
  card: "g_slime",
  intents: [ {
   atk: 4
  }, {
   block: 4,
   atk: 3
  }, {
   atk: 3,
   times: 2
  } ]
 },
 bird: {
  name: "つむじどり",
  attr: "wind",
  hp: 16,
  art: "mon_bird",
  card: "g_bird",
  intents: [ {
   atk: 3,
   times: 2
  }, {
   buff: 1,
   atk: 2
  }, {
   atk: 2,
   times: 3
  } ]
 },
 golem: {
  name: "いわもりゴーレム",
  attr: "earth",
  hp: 17,
  art: "mon_golem",
  card: "g_golem",
  passive: {
   armor: 2
  },
  intents: [ {
   atk: 8
  }, {
   block: 4,
   atk: 3
  }, {
   aoe: 4
  } ]
 },
 ghost: {
  name: "きりの魔女",
  attr: "dark",
  hp: 18,
  art: "mon_ghost",
  card: "g_ghost",
  intents: [ {
   curse: 2,
   atk: 3
  }, {
   atk: 4,
   times: 2
  }, {
   burn: 4
  }, {
   atk: 7
  } ]
 },
 knight: {
  name: "ぎんの騎士",
  attr: "light",
  hp: 21,
  art: "mon_knight",
  card: "g_knight",
  passive: {
   hunter: true
  },
  intents: [ {
   atk: 6
  }, {
   block: 6,
   buff: 1
  }, {
   atk: 3,
   times: 2
  } ]
 },
 wizard: {
  name: "ほしの魔法使い",
  attr: "dark",
  hp: 19,
  art: "mon_wizard",
  card: "g_wizard",
  passive: {
   spite: true
  },
  intents: [ {
   atk: 5
  }, {
   burn: 2,
   atk: 3
  }, {
   aoe: 4
  }, {
   atk: 2,
   times: 3
  } ]
 },
 mush: {
  name: "ねむりキノコ",
  attr: "earth",
  hp: 15,
  art: "mon_mush",
  card: "g_mush",
  intents: [ {
   atk: 4
  }, {
   heal: 3,
   block: 4
  }, {
   atk: 2,
   times: 2
  } ]
 },
 frog: {
  name: "みずべガエル",
  attr: "water",
  hp: 18,
  art: "mon_frog",
  card: "g_frog",
  intents: [ {
   block: 5,
   atk: 3
  }, {
   atk: 2,
   times: 3
  }, {
   buff: 1,
   atk: 3
  } ]
 },
 bat: {
  name: "ほらあなコウモリ",
  attr: "dark",
  hp: 15,
  art: "mon_bat",
  card: "g_bat",
  intents: [ {
   atk: 2,
   times: 3
  }, {
   heal: 4,
   atk: 3
  }, {
   atk: 3,
   times: 2
  } ]
 },
 treant: {
  name: "もりのぬし",
  attr: "wind",
  hp: 22,
  art: "mon_treant",
  card: "g_treant",
  intents: [ {
   atk: 6
  }, {
   heal: 4,
   block: 4
  }, {
   aoe: 3
  } ]
 },
 serpent: {
  name: "みずうみの大へび",
  attr: "water",
  hp: 20,
  art: "mon_serpent",
  card: "g_serpent",
  intents: [ {
   atk: 3,
   times: 2
  }, {
   block: 5,
   buff: 1
  }, {
   atk: 9
  } ]
 },
 gargoyle: {
  name: "いしのガーゴイル",
  attr: "earth",
  hp: 20,
  art: "mon_gargoyle",
  card: "g_gargoyle",
  passive: {
   armor: 2
  },
  intents: [ {
   atk: 6
  }, {
   block: 6,
   atk: 3
  }, {
   atk: 3,
   times: 2
  } ]
 },
 book: {
  name: "まどうしょ",
  attr: "light",
  hp: 17,
  art: "mon_book",
  card: "g_book",
  passive: {
   spite: true
  },
  intents: [ {
   burn: 3,
   atk: 3
  }, {
   curse: 1,
   block: 5
  }, {
   atk: 4,
   times: 2
  } ]
 },
 imp: {
  name: "ほのおのこあくま",
  attr: "fire",
  hp: 17,
  art: "mon_imp",
  card: "g_imp",
  intents: [ {
   burn: 2,
   atk: 3
  }, {
   atk: 3,
   times: 3
  }, {
   buff: 2,
   block: 4
  } ]
 },
 dragon: {
  name: "ほむらドラゴン",
  attr: "fire",
  hp: 66,
  art: "mon_dragon",
  card: "g_dragon",
  boss: true,
  intents: [ {
   atk: 6
  }, {
   burn: 3,
   block: 8
  }, {
   atk: 3,
   times: 3
  }, {
   aoe: 5
  } ],
  phase2: {
   name: "怒り",
   intents: [ {
    buff: 2,
    block: 10
   }, {
    atk: 4,
    times: 3
   }, {
    aoe: 5
   }, {
    atk: 12
   } ]
  }
 },
 witch: {
  name: "やみの魔女王",
  attr: "dark",
  hp: 116,
  art: "mon_witch",
  card: "b_witch",
  boss: true,
  intents: [ {
   curse: 1,
   atk: 4
  }, {
   burn: 3,
   block: 6
  }, {
   atk: 3,
   times: 3
  }, {
   aoe: 4
  } ],
  phase2: {
   name: "狂気",
   intents: [ {
    curse: 2,
    buff: 1
   }, {
    atk: 3,
    times: 4
   }, {
    burn: 4,
    aoe: 3
   }, {
    atk: 12
   } ]
  }
 },
 titan: {
  name: "こおりの巨神",
  attr: "water",
  hp: 90,
  art: "mon_titan",
  card: "b_titan",
  boss: true,
  passive: {
   armor: 2
  },
  intents: [ {
   atk: 8
  }, {
   block: 8,
   buff: 1
  }, {
   aoe: 4
  }, {
   atk: 4,
   times: 2
  } ],
  phase2: {
   name: "暴走",
   intents: [ {
    aoe: 5
   }, {
    atk: 12
   }, {
    block: 10,
    buff: 1
   }, {
    atk: 4,
    times: 3
   } ]
  }
 },
 abyss: {
  name: "くろの騎士王",
  attr: "dark",
  hp: 92,
  art: "mon_abyss",
  card: "b_abyss",
  boss: true,
  final: true,
  passive: {
   armor: 1
  },
  intents: [ {
   atk: 7
  }, {
   block: 8,
   buff: 1
  }, {
   atk: 3,
   times: 3
  }, {
   aoe: 5,
   burn: 2
  } ],
  phase2: {
   name: "王の怒り",
   intents: [ {
    atk: 4,
    times: 3
   }, {
    aoe: 6
   }, {
    buff: 2,
    block: 10
   }, {
    atk: 14
   } ]
  }
 },
 maou: {
  name: "よるの大魔王",
  attr: "dark",
  hp: 108,
  art: "mon_maou",
  card: "b_maou",
  boss: true,
  final: true,
  last: true,
  passive: {
   armor: 2
  },
  intents: [ {
   atk: 8
  }, {
   curse: 1,
   atk: 4,
   times: 2
  }, {
   block: 10,
   buff: 1
  }, {
   aoe: 6,
   burn: 2
  } ],
  phase2: {
   name: "夜明け前",
   intents: [ {
    atk: 4,
    times: 3
   }, {
    aoe: 6
   }, {
    heal: 6,
    buff: 1
   }, {
    atk: 14
   } ]
  }
 }
};

const BOSS_ORDER = [ "dragon", "witch", "titan" ];

const FINAL_BOSS = "abyss";

const LAST_BOSS = "maou";

const FLOOR_SCALE = {
 hp: .09,
 atk: .09
};

const ENEMY_MUL = {
 hp: 1.6,
 atk: 1.38
};

const ELITE = {
 hp: 1.3,
 atk: 1.25,
 goldMul: 2
};

const QUESTS = {
 elite: {
  text: "強敵を1体倒す",
  gold: 40
 },
 combo: {
  text: "1ターンにカードを4枚使う",
  gold: 30
 },
 army: {
  text: "召喚獣を3体いっしょに場に出す",
  gold: 45
 },
 big: {
  text: "1回で10ダメージ以上あたえる",
  gold: 35
 },
 flawless: {
  text: "HPを減らさずに戦闘に勝つ",
  gold: 35
 },
 quick: {
  text: "4ターン以内に戦闘に勝つ",
  gold: 30
 }
};

const PARTNER_DOWN = 2;

const AWAKEN_MP = 5;

const AFTER_END = {
 step: .5,
 max: 4
};

const CHALLENGE = {
 max: 10,
 hp: .16,
 atk: .11,
 reward: .25
};

const MAP = {
 floors: 10,
 enemies: [ {
  from: 1,
  to: 1,
  pool: [ "slime", "mush" ]
 }, {
  from: 2,
  to: 2,
  pool: [ "bird", "mush", "slime" ]
 }, {
  from: 3,
  to: 3,
  pool: [ "frog", "slime", "bird" ]
 }, {
  from: 4,
  to: 4,
  pool: [ "golem", "bat", "slime" ],
  elite: [ "golem", "knight", "bat" ]
 }, {
  from: 5,
  to: 5,
  pool: [ "treant", "ghost", "bird", "bat" ],
  elite: [ "treant", "ghost", "knight" ]
 }, {
  from: 6,
  to: 6,
  pool: [ "serpent", "ghost", "knight", "slime" ],
  elite: [ "serpent", "knight", "ghost" ]
 }, {
  from: 7,
  to: 7,
  pool: [ "knight", "gargoyle", "imp" ],
  elite: [ "gargoyle", "knight", "imp" ]
 }, {
  from: 8,
  to: 8,
  pool: [ "wizard", "book", "imp", "golem" ],
  elite: [ "wizard", "book", "golem" ]
 }, {
  from: 9,
  to: 9,
  pool: [ "wizard", "gargoyle", "knight", "book", "ghost" ],
  elite: [ "wizard", "gargoyle" ]
 }, {
  from: 10,
  to: 10,
  pool: [ "dragon", "witch", "titan" ]
 } ],
 weights: {
  battle: 6,
  elite: 2,
  shop: 1.2,
  train: 1.2,
  event: 1.6
 },
 noEventBefore: 2,
 noEliteBefore: 4,
 kinFrom: 4,
 shopFloors: [ 4, 8 ],
 trainFloors: [ 9 ]
};

const PLAYER = {
 name: "ぼうけんしゃ",
 hp: 34,
 mpMax: 10,
 firstHand: 4,
 drawPerTurn: 1,
 handMax: 9,
 fieldMax: 3
};

const ECONOMY = {
 goldPerWin: n => 10 + n * 2,
 price: key => [ 0, 18, 32, 50 ][CARDS[key].rarity] + CARDS[key].cost * 2,
 removePrice: 25,
 trainPrice: 30,
 shopSize: 5,
 sale: .3
};

const GROWTH = {
 maxLv: 5,
 expToNext: lv => lv * 4,
 trainExp: 6
};

const CUTIN = {
 dragon: {
  style: "fire"
 },
 witch: {
  style: "dark",
  color: "#b07aff"
 },
 titan: {
  style: "ice",
  color: "#9ad8ff"
 },
 abyss: {
  style: "slash",
  color: "#c8c8e0"
 },
 maou: {
  style: "maou",
  color: "#ff2a48",
  ms: 3400
 },
 e_slime: {
  style: "bounce",
  color: "#6ad8ff"
 },
 e_bird: {
  style: "wind",
  color: "#a6f0a0"
 },
 e_knight: {
  style: "light",
  color: "#ffe08a"
 },
 e_ghost: {
  style: "dark",
  color: "#c890ff"
 },
 e_golem: {
  style: "earth",
  color: "#e0b070"
 },
 e_wizard: {
  style: "star",
  color: "#a8c4ff"
 },
 e_dragon: {
  style: "fire",
  color: "#ff8a3a"
 }
};

const BOSS_PLACE = {
 dragon: [ 9, "ほむらの火山" ],
 witch: [ 11, "やみの玉座" ],
 titan: [ 10, "こおりの洞" ],
 abyss: [ 11, "くろの王座" ],
 maou: [ 12, "よるの果て" ]
};

const PLACES = [ "はじまりの草原", "かぜの崖", "みずべの小道", "いわの洞くつ", "ふかい森", "きりの湖", "くずれた城", "ほしの書庫", "やみの回廊", "ほむらの火山" ];

function scaleOps(ops, lv, boost) {
 const k = (lv || 1) - 1;
 return (ops || []).map(o => {
  const r = Object.assign({}, o);
  if (r.n != null) r.n = Math.floor(r.n + (o.g || 0) * k + (o.b || 0) * (boost || 0));
  return r;
 });
}

function addUnit(u, m) {
 for (const k in m) {
  if (Array.isArray(m[k])) u[k] = (u[k] || []).concat(m[k]); else if (typeof m[k] === "number") u[k] = (u[k] || 0) + m[k]; else u[k] = m[k];
 }
}

function mergeOps(ops) {
 const out = [];
 for (const o of ops) {
  const keys = Object.keys(o).filter(k => k !== "op" && k !== "n" && k !== "g");
  const same = !keys.length && out.find(p => p.op === o.op && Object.keys(p).every(k => k === "op" || k === "n" || k === "g"));
  if (same && typeof o.n === "number") same.n += o.n; else out.push(Object.assign({}, o));
 }
 return out;
}

function cardAt(key, lv, boost) {
 const c = CARDS[key];
 lv = lv || 1;
 const learned = [];
 for (const L of [ 3, 5 ]) if (c.learn && c.learn[L] && lv >= L) learned.push(c.learn[L]);
 if (c.unit) {
  const k = lv - 1, u = Object.assign({}, c.unit);
  u.atk += Math.floor(c.unitGrow.atk * k);
  u.hp += Math.floor(c.unitGrow.hp * k);
  for (const m of learned) addUnit(u, m);
  return {
   unit: u,
   cost: c.cost
  };
 }
 const extra = learned.filter(Array.isArray).flat();
 return {
  fx: mergeOps(scaleOps(c.fx, lv, boost).concat(scaleOps(extra, 1, 0))),
  combo: c.combo ? scaleOps(c.combo, lv, boost) : null,
  awaken: c.awaken ? scaleOps(c.awaken, lv, boost) : null,
  cost: Math.max(0, c.cost - (c.boostCost ? boost || 0 : 0))
 };
}

function opText(o) {
 switch (o.op) {
 case "dmg":
  return o.n + "ダメージ" + (o.times > 1 ? "×" + o.times : "");

 case "pierce":
  return o.n + "貫通ダメージ";

 case "block":
  return "防御+" + o.n;

 case "heal":
  return "HP" + o.n + "回復";

 case "draw":
  return o.n + "枚引く";

 case "mp":
  return "MP+" + o.n;

 case "burn":
  return "燃焼" + o.n;

 case "weak":
  return "弱体" + o.n;

 case "vuln":
  return "ひび" + o.n;

 case "thorns":
  return "反撃" + o.n;

 case "rally":
  return "召喚獣ぜんぶ" + (o.atk ? "攻+" + o.atk : "") + (o.atk && o.hp ? "・" : "") + (o.hp ? "体+" + o.hp : "");

 case "flurry":
  return o.n + "ダメージ×(使った枚数+1)";

 case "execute":
  return o.n + "ダメージ。敵が瀕死なら3倍";

 case "shatter":
  return o.n + "ダメージ。ひびなら2倍";

 case "ignite":
  return "燃焼を2倍にして、その数だけダメージ";
 }
 return "";
}

const opsText = ops => ops.map(opText).filter(Boolean).join("、");

function cardText(key, lv, boost) {
 const c = CARDS[key], s = cardAt(key, lv, boost);
 if (c.junk) return "何もしない\n【消滅】";
 if (s.unit) {
  const u = s.unit, out = [ "攻" + u.atk + " / 体" + u.hp ];
  const tags = [ u.ward && "守護", u.rush && "突進", u.double && "2回攻撃" ].filter(Boolean);
  if (tags.length) out.push("【" + tags.join("】【") + "】");
  if (u.onSummon) out.push("召喚時：" + opsText(u.onSummon));
  if (u.onAttack) out.push("攻撃時：" + opsText(u.onAttack));
  if (u.onTurnEnd) out.push("毎ターン：" + opsText(u.onTurnEnd));
  if (u.onSpell) out.push("魔法を使うたび：" + opsText(u.onSpell));
  if (u.onDeath) out.push("破壊時：" + opsText(u.onDeath));
  if (u.thorns) out.push("反撃" + u.thorns);
  return out.join("\n");
 }
 const out = [ opsText(s.fx) ];
 if (s.combo) out.push("【連鎖】" + opsText(s.combo));
 if (s.awaken) out.push("【咆哮】" + opsText(s.awaken));
 if (c.boost) out.push("【溜め】" + (c.boostCost ? "コスト-1" : "+" + c.fx.find(o => o.b).b));
 if (c.exhaust) out.push("【消滅】");
 return out.join("\n");
}

function learnText(key, lv) {
 const c = CARDS[key];
 if (!c.learn) return "";
 return Object.entries(c.learn).filter(([L]) => +L > (lv || 0)).map(([L, v]) => "Lv" + L + "：" + (Array.isArray(v) ? opsText(v) : unitModText(v))).join(" / ");
}

function unitModText(m) {
 const out = [];
 if (m.atk) out.push("攻+" + m.atk);
 if (m.hp) out.push("体+" + m.hp);
 if (m.thorns) out.push("反撃" + m.thorns);
 if (m.double) out.push("2回攻撃");
 if (m.onTurnEnd) out.push("毎ターン：" + opsText(m.onTurnEnd));
 if (m.onAttack) out.push("攻撃時：" + opsText(m.onAttack));
 if (m.onSummon) out.push("召喚時：" + opsText(m.onSummon));
 if (m.onSpell) out.push("魔法を使うたび：" + opsText(m.onSpell));
 return out.join("、");
}

const CARD_INFO = {
 slime: {
  title: "みずうみの ちいさな",
  type: "スライム",
  lv: 3,
  stars: 1,
  hp: 120,
  atk: 24,
  spd: 18,
  ex: "アクアバブル",
  bg: "bg_meadow"
 },
 bird: {
  title: "あらしを よぶ",
  type: "鳥獣",
  lv: 5,
  stars: 2,
  hp: 168,
  atk: 42,
  spd: 55,
  ex: "ゲイルクロー",
  bg: "bg_cliff"
 },
 golem: {
  title: "ねむれる もりの",
  type: "巨人",
  lv: 7,
  stars: 3,
  hp: 260,
  atk: 58,
  spd: 12,
  ex: "ガイアクラッシュ",
  bg: "bg_cave"
 },
 ghost: {
  title: "きりに すむ",
  type: "魔女",
  lv: 6,
  stars: 2,
  hp: 150,
  atk: 61,
  spd: 44,
  ex: "ミストヴェール",
  bg: "bg_cave"
 },
 knight: {
  title: "しろを まもる",
  type: "騎士",
  lv: 7,
  stars: 3,
  hp: 240,
  atk: 55,
  spd: 30,
  ex: "アイアンブレード",
  bg: "bg_cliff"
 },
 wizard: {
  title: "ほしを よむ",
  type: "魔法使い",
  lv: 8,
  stars: 3,
  hp: 190,
  atk: 77,
  spd: 36,
  ex: "スターフォール",
  bg: "bg_cave"
 },
 witch: {
  title: "やみに すむ",
  type: "魔女王",
  lv: 10,
  stars: 4,
  hp: 290,
  atk: 95,
  spd: 48,
  ex: "ナイトメア",
  bg: "bg_cave"
 },
 titan: {
  title: "こおりの ふかくに",
  type: "巨神",
  lv: 10,
  stars: 4,
  hp: 360,
  atk: 82,
  spd: 10,
  ex: "アイスエイジ",
  bg: "bg_cave"
 },
 dragon: {
  title: "ほのおやまの あるじ",
  type: "ドラゴン",
  lv: 10,
  stars: 4,
  hp: 318,
  atk: 90,
  spd: 31,
  ex: "ヘルフレイム",
  bg: "bg_volcano"
 }
};