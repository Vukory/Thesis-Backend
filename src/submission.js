/**
 * @fileoverview
 *   Saves a form submission to both SQLite and JSON. Realistically, just the
 *   one should be enough, but the SQLite API was fairly new and worth trying,
 *   but not stable/mature enough to solely rely on.
 */

import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/**
 * @typedef {{
 *   ageBand?: string,
 *   impressionOfWebsite?: number,
 *   websiteTrust?: number,
 *   websiteKeywords?: string[],
 *   'websiteKeywords-other'?: string,
 *   promptFrequency?: string,
 *   feelingTowardsPrompts?: number,
 *   promptEffectsImpression?: number,
 *   promptImpression?: string[],
 *   'promptImpression-other'?: string,
 *   promptTrust?: number,
 *   isCompliant?: string,
 *   promptInfluence?: string[],
 *   'promptInfluence-other'?: string,
 *   promptAutomation?: string[],
 *   'promptAutomation-other'?: string,
 *   anythingElse?: string,
 *   email?: string,
 *   utm_content?: 'a' | 'b' | 'c',
 * }} SubmissionData
 * 
 * @typedef {object} SubmissionRecord
 * @property {SubmissionData} form
 * @property {UserData} user
 * @property {boolean} verified
 *   Validated form data but with a flag to indicate if the user successfully
 *   completed the captcha. We still accept submissions if the captcha is not
 *   completed, but set `verified` to false to denote that it is less
 *   trustworthy.
 * 
 * @typedef {object} UserData
 * @property {string=} ip
 *   IP of the user. We mostly just want to check if certain IPs seem to be
 *   spamming form submissions. Sometimes this is normal, such as corporate IPs
 *   or VPNs, but most of the time it's probably going to be a malicious user.
 * @property {string=} userAgent
 *   Device/browser combination of the user. If we receive spam, we may ignore
 *   responses based on user-agent instead of IP. A lot of spam can be
 *   distributed these days, but somehow they often still use really old
 *   user-agents.
 * @property {string=} referer
 *   What website directed the user to this form. Will mostly be svgo.dev, but
 *   could be from a note taking app, AI chat, or empty if they transition
 *   device to complete the form on their form, etc. This may help us find if
 *   the form is being linked from elsewhere though.
 */

const SUBMISSIONS_DIR = 'data';
const DB_PATH = path.join(SUBMISSIONS_DIR, 'submissions.db');
const JSON_DIR = path.join(SUBMISSIONS_DIR, 'json');

await fs.mkdir(SUBMISSIONS_DIR, { recursive: true });
const database = new DatabaseSync(DB_PATH);
initialize(database);

/**
 * @param {DatabaseSync} db 
 */
function initialize(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions(
      key INTEGER PRIMARY KEY,
      uuid TEXT,
      data TEXT
    ) STRICT
  `);
}

/**
 * @param {SubmissionRecord} data 
 */
export async function saveSubmission(data) {
  const uuid = randomUUID();
  saveSql(uuid, data);
  return saveJson(uuid, data);
}

/**
 * @param {import('node:crypto').UUID} uuid
 * @param {SubmissionRecord} data 
 */
async function saveJson(uuid, data) {
  await fs.mkdir(JSON_DIR, { recursive: true });
  return fs.writeFile(
    path.join(JSON_DIR, `${uuid}.json`),
    JSON.stringify(data, null, 2)
  );
}

/**
 * @param {import('node:crypto').UUID} uuid
 * @param {SubmissionRecord} data 
 * @returns {import('node:sqlite').StatementResultingChanges}
 */
function saveSql(uuid, data) {
  const insert = database.prepare('INSERT INTO submissions (uuid, data) VALUES (?, ?)');
  return insert.run(uuid, JSON.stringify(data));
}
