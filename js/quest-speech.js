// Quest instructions share one source for visible translations and English
// narration. The wording describes the actual completion hooks in quest.js.
const QuestSpeech=(()=>{
  function details(kind,language=I18n.language,robot=isCaptain()){
    const t=(key,...values)=>PIXELTOWN_LOCALES[language][key].replace(/\{(\d+)\}/g,(m,i)=>i<values.length?String(values[i]):m);
    const placeKeys=robot?{town:'data.robotTown',forest:'data.dinosaurVillage',fairy:'data.droneVillage',unicorn:'data.carVillage',dungeon:'data.villainCave'}:{town:'data.phonicsTown',forest:'data.starlightForestVillage',fairy:'data.fairyVillage',unicorn:'data.unicornVillage',dungeon:'data.crystalCave'};
    const name=key=>t(placeKeys[key]).replace(/^[^\p{L}]+\s/u,'');
    if(QUESTS[kind].place)return{title:t('quest.task.visit.title',name(kind)),help:t('quest.task.visit.help',name(['unicorn','dungeon'].includes(kind)?'forest':'town'))};
    const prefix=`quest.task.${kind}`;
    const robotTitle=robot&&['dust','feed','house'].includes(kind),robotHelp=robot&&['fish','feed','house'].includes(kind);
    return{title:t(`${prefix}.${robotTitle?'robotTitle':'title'}`,QUESTS[kind].n),help:t(`${prefix}.${robotHelp?'robotHelp':'help'}`,name('fairy'))};
  }
  function instruction(kind,robot=isCaptain()){
    const d=details(kind,'en',robot);return `${d.title}. ${d.help}`;
  }
  function phrases(){
    const unique=new Map();
    for(const robot of[false,true])for(const kind of Object.keys(QUESTS)){
      const text=instruction(kind,robot);unique.set(text,{voice:TTS_NARRATOR,text,speed:.9});
    }
    return [...unique.values()];
  }
  function clip(voice,text){return typeof QUESTS_AUDIO_INDEX!=='undefined'?QUESTS_AUDIO_INDEX[voice]?.[String(text).trim().replace(/\s+/g,' ')]:undefined;}
  return{details,instruction,phrases,clip};
})();
