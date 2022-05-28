function feelingSleepy(ms) {
  SpreadsheetApp.flush();
  Utilities.sleep(ms);
  SpreadsheetApp.flush();
}

function getAPIKey() {

  //Get the current global variable - APIKEY
  var scriptProperties = PropertiesService.getScriptProperties();
  var currentKey = scriptProperties.getProperty('APIKEY');

  //Call the API to find out if the currently used key is still valid
  var keyTestResponse = JSON.parse(UrlFetchApp.fetch("https://us.battle.net/oauth/check_token?token=" + currentKey, { "muteHttpExceptions": true }).getContentText());


  Logger.log(keyTestResponse["error"]);

  //If the key is invalid, remake the key by using the username & secret key. If the key is still fine, end the function.
  if (keyTestResponse["error"] == "invalid_token") {
    Logger.log("TRIGGERED THE REMAKING");
    var apiusername = "[[[[REDACTED]]]]";
    var apisecretkey = "[[[[REDACTED]]]]";
    var url = 'https://us.battle.net/oauth/token';
    var options = {
      "method": "POST",
      "headers": { "Authorization": "Basic " + Utilities.base64Encode(apiusername + ":" + apisecretkey) },
      "payload": { "grant_type": "client_credentials" },
      "muteHttpExceptions": true
    };
    //Call the API for a new key
    var apiResponse = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());
    Logger.log(apiResponse);

    //Store the new API key
    scriptProperties.setProperty('APIKEY', apiResponse["access_token"]);




  } else {
    Logger.log("KEY WAS FINE");
  }

  var endingKey = scriptProperties.getProperty('APIKEY');
  Logger.log(endingKey)
  return endingKey;
}

function getResetTimes() {
  'use strict'
  // Get the current time
  let date = new Date();
  const CURRENT_TIME = Math.floor(date.getTime() / 1000) * 1000;

  const WEEK_IN_MS = 604800000;
  const DAY_IN_MS = 86400000;

  // Weekly reset is at Tuesday, 15:00 UTC
  const DAY_TUESDAY = 2;
  const WEEKLY_RESET_OFFSET_IN_MS = 54000000;

  // Check if the weekly reset happened, and if it did: recalculate the current and next weekly resets
  let scriptProperties = PropertiesService.getScriptProperties();
  let nextResetProperty = Number(scriptProperties.getProperty('NEXT_RESET'));
  //Logger.log("current unix time: " + CURRENT_TIME);
  //Logger.log("current Script Properties - NEXT_RESET: " + nextResetProperty);

  if (CURRENT_TIME > nextResetProperty) {

    function getThisResetStartTime() {

      // Get today's midnight
      let today = new Date();
      today.setUTCHours(0, 0, 0);

      // Start the week with Monday, so assign 7 when its a Sunday (0)
      let dayToday = today.getDay() || 7;

      // Calculate ms elapsed since Tuesday
      let msSinceTuesday = ((dayToday - DAY_TUESDAY) * DAY_IN_MS);

      // Subtract today midnight with the diff to get midnight of the Tuesday
      let tuesdayMidnightTime = today.getTime() - msSinceTuesday;

      // Add Weekly Reset Offset, in order to get exact Weekly Reset time
      let tuesdayResetTime = Math.floor((tuesdayMidnightTime + WEEKLY_RESET_OFFSET_IN_MS) / 1000) * 1000;

      return tuesdayResetTime;
    }

    // This is pretty much the same except with an additional week.
    function getNextResetStartTime() {
      return getThisResetStartTime() + WEEK_IN_MS;
    }

    console.log("WEEKLY RESET RECALCULATIONS HAPPENED, NEW INFORMATION BELOW")

    console.log("This Reset: " + new Date(getThisResetStartTime()));
    console.log("Next Reset: " + new Date(getNextResetStartTime()));

    console.log("This Reset [In Unix]: " + getThisResetStartTime());
    console.log("Next Reset [In Unix]: " + getNextResetStartTime());

    scriptProperties.setProperty("THIS_RESET", Number(getThisResetStartTime()))
    scriptProperties.setProperty("NEXT_RESET", Number(getNextResetStartTime()))
  }
  return;
};

function getCurrentResetTime() {
  getResetTimes();
  let scriptProperties = PropertiesService.getScriptProperties();
  let currentResetProperty = Number(scriptProperties.getProperty('THIS_RESET'));
  //Logger.log(currentResetProperty)
  return currentResetProperty;
}

function getNextResetTime() {
  getResetTimes();
  let scriptProperties = PropertiesService.getScriptProperties();
  let nextResetProperty = Number(scriptProperties.getProperty('NEXT_RESET'));
  //Logger.log(nextResetProperty)
  return nextResetProperty;
}

function findItem(array, item) {
  for (var i = 0; i < array.length; i++) {
    if (array[i][0] == item) {
      Logger.log("Found Answer: " + array[i])
      return array[i];
    }
  }
  return "Error"
}

function userInformation(username, realm) {

  getAPIKey();
  var scriptProperties = PropertiesService.getScriptProperties();
  var API_Key = scriptProperties.getProperty('APIKEY');

  //var username = "lexirunebane"
  //var username = "lexiluminate"
  //var username = "lexilaration"
  //var username = "lexilacrity"
  //var username = "lexilunaries"
  //var username = "lexijademist"
  //var username = "leximpyrean"
  //var username = "lexifliction"
  //var realm = "aerie-peak"

  //  Brute force retrying if the API refuses to respond. 
  //  Throttle is 100 requests per second. 36,000 per hour. Very unlikely this gets me rate limited.

  var ilvlResponse = ""
  var gearResponse = ""
  var questResponse = ""
  var compQuestResponse = ""

  //  Debug Variables to just check how many retry attempts were made
  var ilvlRetry = 0
  var regRetry = 0
  var questRetry = 0
  var compQuestRetry = 0

  do {
    ilvlResponse = UrlFetchApp.fetch("https://us.api.blizzard.com/profile/wow/character/" + realm + "/" + username + "?namespace=profile-us&locale=en_US&access_token=" + API_Key, { "muteHttpExceptions": true });
    ilvlRetry++;
    Logger.log("ilvl attempts:" + ilvlRetry);
  } while (ilvlResponse == "")
  feelingSleepy(10);
  do {
    gearResponse = UrlFetchApp.fetch("https://us.api.blizzard.com/profile/wow/character/" + realm + "/" + username + "/equipment?namespace=profile-us&locale=en_US&access_token=" + API_Key, { "muteHttpExceptions": true });
    regRetry++;
    Logger.log("regular attempts:" + regRetry);
  } while (gearResponse == "")
  feelingSleepy(10);
  do {
    questResponse = UrlFetchApp.fetch("https://us.api.blizzard.com/profile/wow/character/" + realm + "/" + username + "/quests?namespace=profile-us&locale=en_US&access_token=" + API_Key, { "muteHttpExceptions": true });
    questRetry++;
    Logger.log("quest attempts:" + questRetry);
  } while (questResponse == "")
  feelingSleepy(10);
  do {
    compQuestResponse = UrlFetchApp.fetch("https://us.api.blizzard.com/profile/wow/character/" + realm + "/" + username + "/quests/completed?namespace=profile-us&locale=en_US&access_token=" + API_Key, { "muteHttpExceptions": true });
    compQuestRetry++;
    Logger.log("quest attempts:" + compQuestRetry);
  } while (compQuestResponse == "")
  feelingSleepy(10);

  //  Parse the JSON
  var ilvlJson = ilvlResponse.getContentText();
  var ilvlData = JSON.parse(ilvlJson);

  var gearJson = gearResponse.getContentText();
  var gearData = JSON.parse(gearJson);

  var questJson = questResponse.getContentText();
  var questData = JSON.parse(questJson);

  var compQuestJson = compQuestResponse.getContentText();
  var compQuestData = JSON.parse(compQuestJson);

  //  Call all the extraction functions
  var ringArr = EnchantRing1(gearData);

  var ringArr2 = EnchantRing2(gearData);

  var mainHandArr = EnchantMainhand(gearData);

  var offHandArr = EnchantOffhand(gearData);

  var backArr = EnchantBack(gearData);

  var chestArr = EnchantChest(gearData);

  var bagilvl = BagItemLevel(ilvlData);

  var onilvl = EquippedItemLevel(ilvlData);

  var weeklyQuest = WeeklyEventQuest(questData, compQuestData);


  /*


  //  Old function that could see reuse if a non-aotc end-boss drops a mount

  var jainaJson = mountResponse.getContentText();
  var jainaData = JSON.parse(jainaJson);
  var jainaMountID = 1219; // Or whatever
  var jainaFind = "No";

  Logger.log(jainaData["mounts"].length)
  
  var i;
  for (i = 0; i < jainaData["mounts"].length; i++) {
    if (jainaData["mounts"][i]["mount"]["id"] == jainaMountID){
      jainaFind = "Yes";
      break;
    }
  }
  */

  //Return the extracted data
  return mainHandArr + "," + offHandArr + "," + backArr + "," + chestArr + "," + ringArr + "," + ringArr2 + "," + bagilvl + "," + onilvl + ", ," + weeklyQuest;
}

function mythicInformation(username, realm) {

  //var username = "Speedymoose"
  //var username = "Viddar"
  //var username = "Lexilunaries"
  //var realm = "aerie-peak"

  var mpResponse = UrlFetchApp.fetch("https://raider.io/api/v1/characters/profile?region=us&realm=" + realm + "&name=" + username + "&fields=mythic_plus_ranks%2Cmythic_plus_weekly_highest_level_runs,mythic_plus_scores_by_season:current");

  var json = mpResponse.getContentText();
  var data = JSON.parse(json);

  var keyDoneThisWeek = !!data["mythic_plus_weekly_highest_level_runs"].length;
  var rioScore = parseInt(data["mythic_plus_scores_by_season"]["0"]["scores"]["all"], 0);
  //Logger.log(data); 
  //Logger.log(keyDoneThisWeek)

  if (keyDoneThisWeek) {
    var dungeon = data["mythic_plus_weekly_highest_level_runs"]["0"]["short_name"];
    var level = data["mythic_plus_weekly_highest_level_runs"]["0"]["mythic_level"];

    return level + "," + dungeon + "," + rioScore;

  } else {
    //Logger.log( "No weekly key");
    return " ,None, " + rioScore;
  }

}

function EnchantRing1(data) {

  var slotSearch = 0;
  var slotFound = 0;
  do {
    if (data["equipped_items"][slotSearch]["slot"]["type"] == "FINGER_1") {
      var finger_1Slot = slotSearch;
      slotFound = 1;
    }
    slotSearch += 1;
  } while (slotFound == 0);

  if (data["equipped_items"][finger_1Slot]["enchantments"] === undefined) {
    return "None";
  }

  var ringEnchant = data["equipped_items"][finger_1Slot]["enchantments"]["0"]["enchantment_id"];

  var enchants = [
    [6163, "Bad", "Bargain of Critical Strike"],
    [6164, "Good", "Tenet of Critical Strike"],
    [6165, "Bad", "Bargain of Haste"],
    [6166, "Good", "Tenet of Haste"],
    [6167, "Bad", "Bargain of Mastery"],
    [6168, "Good", "Tenet of Mastery"],
    [6169, "Bad", "Bargain of Versatility"],
    [6170, "Good", "Tenet of Versatility"]
  ];




  var ringArr = findItem(enchants, ringEnchant);

  if (ringArr != "Error") {
    return ringArr[1];
  }
  else {
    return "Unknown"
  }
}

function EnchantRing2(data) {

  var slotSearch = 0;
  var slotFound = 0;
  do {
    if (data["equipped_items"][slotSearch]["slot"]["type"] == "FINGER_2") {
      var finger_2Slot = slotSearch;
      slotFound = 1;
    }
    slotSearch += 1;
  } while (slotFound == 0);

  if (data["equipped_items"][finger_2Slot]["enchantments"] === undefined) {
    return "None";
  }

  var ringEnchant = data["equipped_items"][finger_2Slot]["enchantments"]["0"]["enchantment_id"];

  var enchants = [
    [6163, "Bad", "Bargain of Critical Strike"],
    [6164, "Good", "Tenet of Critical Strike"],
    [6165, "Bad", "Bargain of Haste"],
    [6166, "Good", "Tenet of Haste"],
    [6167, "Bad", "Bargain of Mastery"],
    [6168, "Good", "Tenet of Mastery"],
    [6169, "Bad", "Bargain of Versatility"],
    [6170, "Good", "Tenet of Versatility"]
  ];

  var ringArr = findItem(enchants, ringEnchant);

  if (ringArr != "Error") {
    return ringArr[1];
  }
  else {
    return "Unknown"
  }
}

function EnchantMainhand(data) {

  var slotSearch = 0;
  var slotFound = 0;
  do {
    if (data["equipped_items"][slotSearch]["slot"]["type"] == "MAIN_HAND") {
      var weaponSlot = slotSearch;
      slotFound = 1;
    }
    slotSearch += 1;
  } while (slotFound == 0);

  if (data["equipped_items"][weaponSlot]["enchantments"] === undefined) {
    return "None";
  }

  var MainhandEnchant = data["equipped_items"][weaponSlot]["enchantments"]["0"]["enchantment_id"];


  var weaponEnchants = [
    //BFA
    [6112, "Machinist's Brilliance"],
    [6148, "Force Multiplier"],
    [6149, "Oceanic Restoration"],
    [6150, "Naga Hide"],
    [5946, "Coastal Surge"],
    [5948, "Siphoning"],
    [5949, "Torrent of Elements"],
    [5950, "Gale-Force Striking"],
    [5965, "Deadly Navigation"],
    [5963, "Quick Navigation"],
    [5964, "Masterful Navigation"],
    [5962, "Versatile Navigation"],
    [5966, "Stalwart Navigation"],
    //HUNTER SCOPES
    [5955, "Crow's Nest Scope"],
    [5958, "Frost-Laced Ammunition"],
    [5957, "Incendiary Ammunition"],
    [5956, "Monelite Scope of Alacrity"],


    //DK RUNEFORGES
    [3370, "[R] Razorice"],
    [3368, "[R] Fallen Crusader"],

    //SHADOWLANDS
    [6223, "Lightless Force"],
    [6226, "Eternal Grace"],
    [6227, "Ascended Vigor"],
    [6228, "Sinful Revelation"],
    [6229, "Celestial Guidance"],
    //HUNTER SCOPES
    [6195, "[S] Haste"],
    [6196, "[S] Crit"],

    //OILS / STONES
    [6190, "None "] //Embalmers Oil
  ];

  var weaponArr = findItem(weaponEnchants, MainhandEnchant);

  if (weaponArr != "Error") {
    return weaponArr[1];
  }
  else {
    return "Unknown"
  }
}

function EnchantOffhand(data) {

  var slotSearch = 0;
  var slotFound = 0;

  try {
    do {
      if (data["equipped_items"][slotSearch]["slot"]["type"] == "OFF_HAND") {
        var weaponSlot = slotSearch;
        if (data["equipped_items"][weaponSlot]["inventory_type"]["type"] == "WEAPON" || data["equipped_items"][weaponSlot]["inventory_type"]["type"] == "TWOHWEAPON") {
          slotFound = 1;
        }
        else {
          return "Unenchantable"
        }
      }
      slotSearch += 1;
    } while (slotFound == 0);
  } catch (error) {
    return "No Offhand"
  }


  if (data["equipped_items"][weaponSlot]["enchantments"] === undefined) {
    return "None";
  }

  var MainhandEnchant = data["equipped_items"][weaponSlot]["enchantments"]["0"]["enchantment_id"];




  var weaponEnchants = [
    //BFA
    [6112, "Machinist's Brilliance"],
    [6148, "Force Multiplier"],
    [6149, "Oceanic Restoration"],
    [6150, "Naga Hide"],
    [5946, "Coastal Surge"],
    [5948, "Siphoning"],
    [5949, "Torrent of Elements"],
    [5950, "Gale-Force Striking"],
    [5965, "Deadly Navigation"],
    [5963, "Quick Navigation"],
    [5964, "Masterful Navigation"],
    [5962, "Versatile Navigation"],
    [5966, "Stalwart Navigation"],
    //HUNTER SCOPES
    [5955, "Crow's Nest Scope"],
    [5958, "Frost-Laced Ammunition"],
    [5957, "Incendiary Ammunition"],
    [5956, "Monelite Scope of Alacrity"],


    //DK RUNEFORGES
    [3370, "[R] Razorice"],
    [3368, "[R] Fallen Crusader"],

    //SHADOWLANDS
    [6223, "Lightless Force"],
    [6226, "Eternal Grace"],
    [6227, "Ascended Vigor"],
    [6228, "Sinful Revelation"],
    [6229, "Celestial Guidance"],
    //HUNTER SCOPES
    [6195, "[S] Haste"],
    [6196, "[S] Crit"],

    //OILS / STONES
    [6190, "None "] //Embalmers Oil
  ];

  var weaponArr = findItem(weaponEnchants, MainhandEnchant);

  if (weaponArr != "Error") {
    return weaponArr[1];
  }
  else {
    return "Unknown"
  }
}

function EnchantBack(data) {

  var slotSearch = 0;
  var slotFound = 0;
  do {
    if (data["equipped_items"][slotSearch]["slot"]["type"] == "BACK") {
      var backSlot = slotSearch;
      slotFound = 1;
    }
    slotSearch += 1;
  } while (slotFound == 0);

  if (data["equipped_items"][backSlot]["enchantments"] === undefined) {
    return "None";
  }

  var backEnchant = data["equipped_items"][backSlot]["enchantments"]["0"]["enchantment_id"];

  var enchants = [
    [6202, "Good", "Fortified Speed"],
    [6203, "Good", "Fortified Avoidance"],
    [6204, "Good", "Fortified Leech"],
    [6208, "Bad", "Soul Vitality"]
  ];

  var backArr = findItem(enchants, backEnchant);

  if (backArr != "Error") {
    return backArr[1];
  }
  else {
    return "Unknown"
  }
}

function EnchantChest(data) {

  var slotSearch = 0;
  var slotFound = 0;
  do {
    if (data["equipped_items"][slotSearch]["slot"]["type"] == "CHEST") {
      var chestSlot = slotSearch;
      slotFound = 1;
    }
    slotSearch += 1;
  } while (slotFound == 0);

  if (data["equipped_items"][chestSlot]["enchantments"] === undefined) {
    return "None";
  }

  var chestEnchant = data["equipped_items"][chestSlot]["enchantments"]["0"]["enchantment_id"];

  var enchants = [
    [6213, "Good", "Eternal Bulwark"],
    [6214, "Good", "Eternal Skirmish"],
    [6216, "Bad", "Sacred Stats"],
    [6217, "Good", "Eternal Bounds"],
    [6230, "Good", "Eternal Stats"],
    [6265, "Good", "Eternal Insight"]
  ];

  var chestArr = findItem(enchants, chestEnchant);

  if (chestArr != "Error") {
    return chestArr[1];
  }
  else if (data["equipped_items"][chestSlot]["enchantments"]["0"]["enchantment_slot"]["type"] == "TEMPORARY") {
    return "None";
  } else {
    return "Unknown";
  }
}

function BagItemLevel(data) {

  var ilvl = data["average_item_level"];


  //Logger.log(ilvl);
  return ilvl;
}

function EquippedItemLevel(data) {

  var ilvl = data["equipped_item_level"];

  //Logger.log(ilvl);
  return ilvl;
}

function WeeklyEventQuest(progData, completedData) {

  var weeklyQuests = [
    [62638, "Emissary of War"],
    [62637, "A Call to Battle"],
    [62635, "A Shrouded Path Through Time"], //MoP TW
    [62632, "A Burning Path Through Time"], //TBC TW
    [],
    []
  ];

  var questFound = 0;
  var questID = 0;
  var questStatus = 0;
  var compQuestSearch = completedData["quests"].length - 1;


  for (var i = 0; i < 250; i++) {
    for (var j = 0; j < weeklyQuests.length; j++) {
      if (completedData["quests"][compQuestSearch]["id"] == weeklyQuests[j][0]) {
        questID = weeklyQuests[j][0];
        questFound = 1;
        questStatus = "Complete";
        Logger.log("QUESTCHECK: Complete")
        var foundIn = (completedData["quests"].length - 1) - compQuestSearch
        Logger.log("FOUND IN: " + foundIn)
      }
    }
    compQuestSearch--;
  }

  if (questFound == 0) {
    for (var i = 0; i < progData["in_progress"].length; i++) {
      for (var j = 0; j < weeklyQuests.length; j++) {
        if (progData["in_progress"][i]["id"] == weeklyQuests[j][0]) {
          questID = weeklyQuests[j][0];
          questFound = 1;
          questStatus = "Progress";
          Logger.log("QUESTCHECK: Progress")
        }
      }
    }
  }

  if (questFound == 0) {
    questStatus = "Missing";
    Logger.log("QUESTCHECK: Missing")
  }

  return questStatus;

}
