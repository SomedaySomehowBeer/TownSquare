"use strict";

// Durable, identifier-free daily analytics. Unlike visitor-stats, this store
// deliberately has no retention limit: it contains only per-site/day numbers,
// never browser IDs, event timestamps, or hourly activity masks.

const fs = require("fs");
const { atomicWriteJson } = require("./atomic-write");

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SAVE_INTERVAL_MS = 60000;
const STORAGE_VERSION = 1;

function dayIndex(at) {
  return Math.floor(at / DAY_MS);
}

function createHistoricalStats(options = {}) {
  const filePath = options.filePath || null;
  const now = options.now || Date.now;
  const saveIntervalMs = options.saveIntervalMs ?? DEFAULT_SAVE_INTERVAL_MS;
  // siteKey -> (UTC day index -> { visitors, messages })
  const bySite = new Map();
  let dirty = false;
  let timer = null;

  function siteDays(siteKey) {
    let days = bySite.get(siteKey);
    if (!days) {
      days = new Map();
      bySite.set(siteKey, days);
    }
    return days;
  }

  function bucket(siteKey, day) {
    const days = siteDays(siteKey);
    let entry = days.get(day);
    if (!entry) {
      entry = { visitors: 0, messages: 0 };
      days.set(day, entry);
    }
    return entry;
  }

  function recordVisitor(siteKey, at = now()) {
    if (!siteKey) return false;
    bucket(siteKey, dayIndex(at)).visitors += 1;
    dirty = true;
    return true;
  }

  function recordMessage(siteKey, at = now()) {
    if (!siteKey) return false;
    bucket(siteKey, dayIndex(at)).messages += 1;
    dirty = true;
    return true;
  }

  // Import any detail that predates the historical store. Existing durable
  // values win, so this is safe to run on every startup.
  function seedDetailed(visitorCounts = {}, messageCounts = {}) {
    for (const [siteKey, days] of Object.entries(visitorCounts)) {
      for (const [dayKey, visitors] of Object.entries(days || {})) {
        const day = Number(dayKey);
        if (!Number.isInteger(day) || !Number.isFinite(visitors) || visitors < 0) continue;
        const entry = bucket(siteKey, day);
        if (entry.visitors === 0 && visitors > 0) {
          entry.visitors = Math.floor(visitors);
          dirty = true;
        }
      }
    }
    for (const [siteKey, days] of Object.entries(messageCounts)) {
      for (const [dayKey, messages] of Object.entries(days || {})) {
        const day = Number(dayKey);
        if (!Number.isInteger(day) || !Number.isFinite(messages) || messages < 0) continue;
        const entry = bucket(siteKey, day);
        if (entry.messages === 0 && messages > 0) {
          entry.messages = Math.floor(messages);
          dirty = true;
        }
      }
    }
  }

  function getAggregateDailySeries(metric, windowDays, at = now()) {
    const today = dayIndex(at);
    const series = [];
    for (let offset = windowDays - 1; offset >= 0; offset -= 1) {
      const day = today - offset;
      let count = 0;
      for (const days of bySite.values()) count += days.get(day)?.[metric] || 0;
      series.push({ day, count });
    }
    return series;
  }

  function getActiveSiteSeries(seriesDays, windowDays, at = now()) {
    const today = dayIndex(at);
    const firstDay = today - (seriesDays - 1);
    const counts = Array(seriesDays).fill(0);
    for (const days of bySite.values()) {
      let visitorsInWindow = 0;
      for (let day = firstDay - (windowDays - 1); day <= firstDay; day += 1) {
        visitorsInWindow += days.get(day)?.visitors || 0;
      }
      for (let offset = 0; offset < seriesDays; offset += 1) {
        if (visitorsInWindow > 0) counts[offset] += 1;
        const displayedDay = firstDay + offset;
        visitorsInWindow += days.get(displayedDay + 1)?.visitors || 0;
        visitorsInWindow -= days.get(displayedDay - (windowDays - 1))?.visitors || 0;
      }
    }
    return counts.map((count, offset) => ({ day: firstDay + offset, count }));
  }

  function snapshot() {
    const sites = {};
    for (const [siteKey, days] of bySite) {
      const savedDays = {};
      for (const [day, entry] of days) savedDays[day] = [entry.visitors, entry.messages];
      if (Object.keys(savedDays).length > 0) sites[siteKey] = savedDays;
    }
    return { version: STORAGE_VERSION, sites };
  }

  function load() {
    if (!filePath) return;
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") console.warn(`Could not load historical stats: ${error.message}`);
      return;
    }
    if (!raw?.sites || typeof raw.sites !== "object") return;
    bySite.clear();
    for (const [siteKey, dayObj] of Object.entries(raw.sites)) {
      if (!dayObj || typeof dayObj !== "object") continue;
      for (const [dayKey, values] of Object.entries(dayObj)) {
        const day = Number(dayKey);
        const [visitors, messages] = Array.isArray(values) ? values : [];
        if (!Number.isInteger(day)) continue;
        const safeVisitors = Number.isFinite(visitors) && visitors >= 0 ? Math.floor(visitors) : 0;
        const safeMessages = Number.isFinite(messages) && messages >= 0 ? Math.floor(messages) : 0;
        if (safeVisitors || safeMessages) siteDays(siteKey).set(day, { visitors: safeVisitors, messages: safeMessages });
      }
    }
  }

  function flush(force = false) {
    if (!filePath || (!dirty && !force)) return;
    atomicWriteJson(filePath, snapshot());
    dirty = false;
  }

  function start() {
    if (timer || !filePath) return;
    timer = setInterval(() => flush(), saveIntervalMs);
    if (typeof timer.unref === "function") timer.unref();
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  return { recordVisitor, recordMessage, seedDetailed, getAggregateDailySeries, getActiveSiteSeries, load, flush, start, stop };
}

module.exports = { createHistoricalStats };
