/* eslint-env node */
'use strict';

const { readFileSync } = require('fs');
const { resolve } = require('path');

const guestsPath = resolve(__dirname, '..', 'public', 'content', 'guests.json');

function normalizeGuestSlug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function fail(message) {
  console.error('\n\u2717 guests.json validation failed:\n  ' + message + '\n');
  process.exit(1);
}

let raw;
try {
  raw = readFileSync(guestsPath, 'utf-8');
} catch (error) {
  fail('Unable to read ' + guestsPath + ': ' + error.message);
}

let data;
try {
  data = JSON.parse(raw);
} catch (error) {
  fail('Invalid JSON in ' + guestsPath + ': ' + error.message);
}

const guests = Array.isArray(data)
  ? data
  : data && Array.isArray(data.guests)
    ? data.guests
    : null;

if (!guests) {
  fail('Expected a `guests` array (or a top-level array of guest entries).');
}

const seen = new Map();
const duplicates = [];

guests.forEach(function (guest, index) {
  if (!guest || typeof guest.url !== 'string' || !guest.url.trim()) {
    fail('Guest at index ' + index + ' is missing a valid `url` string.');
  }

  const slug = normalizeGuestSlug(guest.url);
  if (!slug) {
    fail('Guest at index ' + index + ' has a `url` that normalizes to an empty slug (`' + guest.url + '`).');
  }

  const previous = seen.get(slug);
  if (previous !== undefined) {
    duplicates.push({
      slug: slug,
      first: { index: previous.index, url: previous.url },
      second: { index: index, url: guest.url },
    });
  } else {
    seen.set(slug, { index: index, url: guest.url });
  }
});

if (duplicates.length > 0) {
  const lines = duplicates.map(function (dup) {
    return (
      '  - slug "' + dup.slug + '" is used by both:\n' +
      '      [' + dup.first.index + '] url="' + dup.first.url + '"\n' +
      '      [' + dup.second.index + '] url="' + dup.second.url + '"'
    );
  });
  fail('Duplicate guest url slug(s) detected:\n' + lines.join('\n'));
}

console.log('\u2713 guests.json OK (' + guests.length + ' unique guest urls)');
