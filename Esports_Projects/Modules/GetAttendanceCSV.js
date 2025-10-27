// ARGS: None.
const fileStartDate = new Date(2025, 8, 1, 0, 0, 0, 0); // months are 0-based: 8 == September
const PlayerPath = "./Esports_Projects/Players/";
const eventPath = './Esports_Projects/Events/';

const fs = require('fs');
class Player {
    line = "";
    
    constructor(last, first, id, grade, gender, dob, notes, scholarship) {
        this.line = `${last},${first},${id},${grade},${gender},${dob},${notes},${scholarship},`;
    }

    getLine() {
        return this.line;
    }

    setAttending(dayOffset) {
        dayOffset += 7; // 8 Fields from start of data.
        const data = this.line.split(",");
        data[dayOffset] = 1;
        this.line = data.join(",");
    }
}

/**
 * Return the number of weekdays (Mon-Fri) between two dates.
 *
 * Inputs:
 *  - startDate, endDate: Date object, timestamp, or date string parseable by Date
 *  - inclusive (optional): boolean, defaults to true. If true, include both start and end days in the count.
 *
 * Output: integer number of weekdays (0..)
 *
 * Behavior / edge cases:
 *  - If startDate > endDate, it swaps them.
 *  - Uses UTC date arithmetic to avoid DST/timezone pitfalls.
 *  - Efficient: computes whole weeks + remainder (no heavy loops over long ranges).
 */
function weekdaysBetween(startDate, endDate, inclusive = true) {
  if (startDate == null || endDate == null) {
    throw new TypeError('startDate and endDate are required');
  }

  // Normalize to UTC midnight milliseconds for safe day arithmetic
  const toUTCmidnight = (d) => {
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) throw new TypeError('Invalid date: ' + d);
    return Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
  };

  let startMs = toUTCmidnight(startDate);
  let endMs = toUTCmidnight(endDate);

  if (startMs > endMs) {
    // swap so start <= end
    [startMs, endMs] = [endMs, startMs];
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  // totalDays is count of day boundaries between start and end.
  // If inclusive, include both endpoints.
  let totalDays = Math.floor((endMs - startMs) / msPerDay) + (inclusive ? 1 : 0);
  if (totalDays <= 0) return 0;

  const startDay = new Date(startMs).getUTCDay(); // 0=Sun,1=Mon,...6=Sat
  const fullWeeks = Math.floor(totalDays / 7);
  let weekdays = fullWeeks * 5;

  // handle remaining days (at most 6)
  const remainder = totalDays % 7;
  for (let i = 0; i < remainder; i++) {
    const day = (startDay + i) % 7;
    if (day !== 0 && day !== 6) weekdays++;
  }

  return weekdays;
}

/**
 * @type {Player[]}
 */
let players = [];

function ensureHasPlayer(id) {
    if (players[id] == undefined) {
        /**
         * @type {{Name: string, PlayedGames: string[], Discord_id: string, Student_id: string, Grade: string}}
         */
        const data = JSON.parse(fs.readFileSync(PlayerPath + id + ".json"));
        const names = data.Name.split(" ");
        const lastName = names[names.length - 1];
        const firstName = names.slice(0, -1).join(" ");
        players[id] = new Player(lastName, firstName, data.Student_id, data.Grade, "null", "null", "File #" + id, "null");
    }
}

// Load events and process them synchronously.
const events = fs.readdirSync(eventPath);
events.forEach(file => {
    const json = JSON.parse(fs.readFileSync(eventPath + file));

    // Make date of event...
    const eventDate = new Date(json.Date);
    
    // Calculate offset of number of weekdays.
    const offset = weekdaysBetween(fileStartDate, eventDate, true);

    // Put attendance into player.
    json.Attending.forEach(playerId => {
      // Make sure players are loaded.
      ensureHasPlayer(playerId)

      players[playerId].setAttending(offset);
    });
})

const output = players.filter(v => {
    return v != null 
        // Ignore test players.
        && !v.getLine().includes("PlayVS") 
        && !v.getLine().includes("Coach") 
        && !v.getLine().includes("Micah") 

}).map(v => v.getLine()).join("\n");

// Tell the client to download/parse this file as CSV. 
res.setHeader("Content-Type", "text/csv");
res.setHeader("content-disposition", "attachment; filename=\"AttendanceData.csv\"")
res.end(output);