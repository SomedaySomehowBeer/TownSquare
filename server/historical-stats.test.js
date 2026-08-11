"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createHistoricalStats } = require("./historical-stats");

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY0 = Date.UTC(2026, 0, 1);
const day = (n, hour = 12) => DAY0 + n * DAY_MS + hour * 60 * 60 * 1000;

test("retains identifier-free daily visitor and message totals without pruning", () => {
  const stats = createHistoricalStats();
  stats.recordVisitor("one", day(0));
  stats.recordVisitor("two", day(0));
  stats.recordMessage("two", day(0));
  stats.recordMessage("two", day(0));

  const visitors = stats.getAggregateDailySeries("visitors", 1, day(1000));
  const messages = stats.getAggregateDailySeries("messages", 1, day(1000));
  assert.equal(visitors[0].count, 0, "a one-day view does not include ancient history");
  assert.equal(messages[0].count, 0);

  const originalDay = Math.floor(day(0) / DAY_MS);
  assert.deepEqual(
    stats.getAggregateDailySeries("visitors", 1001, day(1000)).find((entry) => entry.day === originalDay),
    { day: originalDay, count: 2 },
  );
  assert.deepEqual(
    stats.getAggregateDailySeries("messages", 1001, day(1000)).find((entry) => entry.day === originalDay),
    { day: originalDay, count: 2 },
  );
});

test("persists compact values and seeds missing detail only once", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ts-history-"));
  const filePath = path.join(dir, "historical-stats.json");
  try {
    const first = createHistoricalStats({ filePath, now: () => day(5) });
    first.recordVisitor("site", day(5));
    first.recordMessage("site", day(5));
    first.flush();

    const saved = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const savedEntry = saved.sites.site[Math.floor(day(5) / DAY_MS)];
    assert.deepEqual(savedEntry, [1, 1], "history stores only two numeric counters per day");

    const second = createHistoricalStats({ filePath, now: () => day(5) });
    second.load();
    second.seedDetailed({ site: { [Math.floor(day(5) / DAY_MS)]: 9 } }, { site: { [Math.floor(day(5) / DAY_MS)]: 9 } });
    assert.equal(second.getAggregateDailySeries("visitors", 1, day(5))[0].count, 1);
    assert.equal(second.getAggregateDailySeries("messages", 1, day(5))[0].count, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("calculates active sites from durable daily visitor counts", () => {
  const stats = createHistoricalStats();
  stats.recordVisitor("early", day(1));
  stats.recordVisitor("recent", day(3));
  const series = stats.getActiveSiteSeries(3, 2, day(3));
  assert.deepEqual(series.map((entry) => entry.count), [1, 1, 1]);
});
