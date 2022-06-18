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
  console.log(currentResetProperty)
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
  let scriptProperties = PropertiesService.getScriptProperties();
  let API_Key = scriptProperties.getProperty('APIKEY');

  //var username = "frikityfrack"
  //var username = "lexirunebane"
  //var username = "lexiluminate"
  //var username = "lexilaration"
  //var username = "lexilacrity"
  //var username = "lexilunaries"
  //var username = "lexijademist"
  //var username = "leximpyrean"
  //var username = "lexifliction"
  //var realm = "aerie-peak"
  //var realm = "stormrage"


  //  Brute force retrying if the API refuses to respond. 
  //  Throttle is 100 requests per second. 36,000 per hour. Very unlikely this gets me rate limited.

  let ilvlResponse = ""
  let gearResponse = ""
  let questResponse = ""
  let compQuestResponse = ""
  let raidVaultResponse = ""

  //  Debug Variables to just check how many retry attempts were made
  let ilvlRetry = 0
  let regRetry = 0
  let questRetry = 0
  let compQuestRetry = 0
  let raidVaultRetry = 0

  do {
    ilvlResponse = UrlFetchApp.fetch("https://us.api.blizzard.com/profile/wow/character/" + realm + "/" + username + "?namespace=profile-us&locale=en_US&access_token=" + API_Key, { "muteHttpExceptions": true });
    ilvlRetry++;
    Logger.log("ilvl attempts:" + ilvlRetry);
    feelingSleepy(10);
  } while (ilvlResponse == "")

  do {
    gearResponse = UrlFetchApp.fetch("https://us.api.blizzard.com/profile/wow/character/" + realm + "/" + username + "/equipment?namespace=profile-us&locale=en_US&access_token=" + API_Key, { "muteHttpExceptions": true });
    regRetry++;
    Logger.log("regular attempts:" + regRetry);
    feelingSleepy(10);
  } while (gearResponse == "")

  do {
    questResponse = UrlFetchApp.fetch("https://us.api.blizzard.com/profile/wow/character/" + realm + "/" + username + "/quests?namespace=profile-us&locale=en_US&access_token=" + API_Key, { "muteHttpExceptions": true });
    questRetry++;
    Logger.log("quest attempts:" + questRetry);
    feelingSleepy(10);
  } while (questResponse == "")

  do {
    compQuestResponse = UrlFetchApp.fetch("https://us.api.blizzard.com/profile/wow/character/" + realm + "/" + username + "/quests/completed?namespace=profile-us&locale=en_US&access_token=" + API_Key, { "muteHttpExceptions": true });
    compQuestRetry++;
    Logger.log("quest attempts:" + compQuestRetry);
    feelingSleepy(10);
  } while (compQuestResponse == "")

  do {
    raidVaultResponse = UrlFetchApp.fetch("https://us.api.blizzard.com/profile/wow/character/" + realm + "/" + username + "/achievements/statistics?namespace=profile-us&locale=en_US&access_token=" + API_Key, { "muteHttpExceptions": true });
    raidVaultRetry++;
    Logger.log("raid vault attempts:" + raidVaultRetry);
  } while (raidVaultResponse == "")


  //  Parse the JSON
  let ilvlJson = ilvlResponse.getContentText();
  let ilvlData = JSON.parse(ilvlJson);

  let gearJson = gearResponse.getContentText();
  let gearData = JSON.parse(gearJson);

  let questJson = questResponse.getContentText();
  let questData = JSON.parse(questJson);

  let compQuestJson = compQuestResponse.getContentText();
  let compQuestData = JSON.parse(compQuestJson);


  let raidVaultJson = raidVaultResponse.getContentText();
  let raidVaultTemp = JSON.parse(raidVaultJson);


  /*
  ** In order to find Shadowlands Raid Statistics, it is stored as follows:
  ** ["categories"][<category number>]["sub_categories"][<expansion number>]
  ** However, if a character is missing achievements in a certain category (IE: Social {usually #6}), 
  ** then it is skipped and "Dungeons & Raids" that is usually #9 gets bumped to #8.
  **
  ** The same occurs for <expansion number>. If a character has no raid or dungeon kills in
  ** say, Cataclysm {usually #3}, then Shadowlands {usually #8} becomes #7.
  **
  ** Because of this, we need to search through the JSON data to find where
  ** both "Dungeons & Raids" and "Shadowlands" are.
  **
  ** This gives the added benefit of future-proofing for Dragonflight and future expansions,
  ** as "Shadowlands" in the search function can just be changed to "Dragonflight", or the relevant name.
  */


  let dAndRCatNumSearch = 0;
  let dAndRCatNumFound = 0;
  do {
    if (raidVaultTemp["categories"][dAndRCatNumSearch]["name"] == "Dungeons & Raids") {
      var dAndRCatNumber = dAndRCatNumSearch;
      dAndRCatNumFound = 1;
    }
    dAndRCatNumSearch += 1;
  } while (dAndRCatNumFound == 0);

  let xpacSearch = 0;
  let xpacFound = 0;
  do {
    if (raidVaultTemp["categories"][dAndRCatNumber]["sub_categories"][xpacSearch]["name"] == "Shadowlands") {
      var xpacsNumber = xpacSearch;
      xpacFound = 1;
    }
    xpacSearch += 1;
  } while (xpacFound == 0);


  let raidVaultData = raidVaultTemp["categories"][dAndRCatNumber]["sub_categories"][xpacsNumber]["statistics"];

  let resetTime = getCurrentResetTime();



  //  Call all the extraction functions
  let ringArr = enchantRing1(gearData);

  let ringArr2 = enchantRing2(gearData);

  let mainHandArr = enchantMainhand(gearData);

  let offHandArr = enchantOffhand(gearData);

  let backArr = enchantBack(gearData);

  let chestArr = enchantChest(gearData);

  let bagilvl = bagItemLevel(ilvlData);

  let onilvl = equippedItemLevel(ilvlData);

  let weeklyQuest = weeklyEventQuest(questData, compQuestData);

  let raidVaultArr = weeklyRaidingVault(raidVaultData, resetTime);



  //Return the extracted data
  return mainHandArr + "," + offHandArr + "," + backArr + "," + chestArr + "," + ringArr + "," + ringArr2 + "," + bagilvl + "," + onilvl + ", ," + weeklyQuest + ", ," + raidVaultArr;
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

function enchantRing1(data) {

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

function enchantRing2(data) {

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

function enchantMainhand(data) {

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

function enchantOffhand(data) {

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

function enchantBack(data) {

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

function enchantChest(data) {

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

function bagItemLevel(data) {

  var ilvl = data["average_item_level"];


  //Logger.log(ilvl);
  return ilvl;
}

function equippedItemLevel(data) {

  var ilvl = data["equipped_item_level"];

  //Logger.log(ilvl);
  return ilvl;
}

function weeklyEventQuest(progData, completedData) {

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



function weeklyRaidingVault(raidData, resetTime) {

  // Set up an Array for each boss.
  let bossKillArr = ["", "", "", "", "", "", "", "", "", "", ""]

  const RAIDBOSSAMOUNT = 11;
  let bossIDsArr = [
    //  Name,   Myth,  Hero,  Norm,  LFR
    ["Vigil", 15427, 15426, 15425, 15424],
    ["Skole", 15431, 15430, 15429, 15428],
    ["Xymox", 15435, 15434, 15433, 15432],
    ["Dause", 15439, 15438, 15437, 15436],
    ["Panth", 15443, 15442, 15441, 15440],
    ["Lihuv", 15447, 15446, 15445, 15444],
    ["Halon", 15451, 15450, 15449, 15448],
    ["Andui", 15455, 15454, 15453, 15452],
    ["Lords", 15459, 15458, 15457, 15456],
    ["Rygel", 15463, 15462, 15461, 15460],
    ["Jaile", 15467, 15466, 15465, 15464]
  ];

  var bossNumber = 0;
  //bossIDsArr.forEach(findBossKill(raidData, bossIDsArr))
  //console.log(raidData)
  //bossIDsArr.forEach(findBossKill)

  console.log(resetTime);


  //function findBossKill() {
  for (h = 0; h < RAIDBOSSAMOUNT; h++) {
    for (i = 1; i < 5; i++) {
      //console.log("i is: " + i + "  h is: " + h)

      // Search the whole of Shadowlands Kill Statistics JSON
      let j = 0
      let bossFound = 0;
      do {
        j = j + 1;
        //console.log("j is: " + j) confirmed -- it is looping the whole thing [KEK]
        //console.log("raidData's Boss is: " + raidData[j]["id"] + " bossIDsArr[h][i] is: " + bossIDsArr[h][i])   //confirmed -- it is looping the whole thing [KEK] (confirmed -- raidData's Boss is: 15444 bossIDsArr[h][i] is: 15444)
        // In each entry, check if the "id" property matches what we're searching for.
        if (raidData[j]["id"] == bossIDsArr[h][i]) {
          // If it does, then we need to check if it was killed within this weekly reset.
          if (raidData[j]["last_updated_timestamp"] > resetTime) {

            // If it was killed this reset, add the correct letter difficulty,
            switch (i) {
              case 1:
                bossKillArr.splice(h, 1, "M");
                break;

              case 2:
                bossKillArr.splice(h, 1, "H");
                break;

              case 3:
                bossKillArr.splice(h, 1, "N");
                break;

              case 4:
                bossKillArr.splice(h, 1, "LFR");
                break;

              default:
                bossKillArr.splice(h, 1, "");
                console.log("Something brokey, in order to hit this.");
                break;
            }
            // then stop searching this boss and go to the next.
            bossFound = 1;
          }
        }
      } while (j < raidData.length - 1 && bossFound == 0);
    }
    bossNumber = bossNumber + 1;
  }

  console.log("bossKillArr Looks like: " + bossKillArr);




  var [mythic, heroic, normal, lfraid] = [0, 0, 0, 0];
  var [slot1, slot2, slot3] = ["-", "-", "-"];
  var vaultFinalized = "";

  // Loop through the Array, and turn the kills into Great Vault format.
  bossKillArr.forEach(killFinder);
  function killFinder(difficultyCode) {
    if (difficultyCode == "M") {
      mythic += 1; heroic += 1; normal += 1; lfraid += 1;
    }
    if (difficultyCode == "H") {
      heroic += 1; normal += 1; lfraid += 1;
    }
    if (difficultyCode == "N") {
      normal += 1; lfraid += 1;
    }
    if (difficultyCode == "LFR") {
      lfraid += 1;
    }
  }


  calcTheVault(mythic, "M");
  calcTheVault(heroic, "H");
  calcTheVault(normal, "N");
  calcTheVault(lfraid, "LFR");


  function calcTheVault(diffKills, difficultyName) {

    // If the slot is currently empty, 
    if (slot1 == "-" && diffKills >= 2) {
      slot1 = difficultyName;
      vaultFinalized += "" + difficultyName + ","
    }

    if (slot2 == "-" && diffKills >= 5) {
      slot2 = difficultyName;
      vaultFinalized += "" + difficultyName + ","
    }

    if (slot3 == "-" && diffKills >= 8) {
      slot3 = difficultyName;
      vaultFinalized += "" + difficultyName
    }
    return;
  }

  return (slot1 + "," + slot2 + "," + slot3)

}
