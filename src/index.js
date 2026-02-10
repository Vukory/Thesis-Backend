import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { createChallenge, verifySolution } from 'altcha-lib';
import cors from 'cors';
import express from 'express';
import { getConfig } from './config.js';
import { getRoutes } from './routes.js';
import { LIKERT, MULTIPLE_CHOICE, SINGLE_CHOICE, TEXT_AREA, TEXT_FIELD } from './json-schema.js';

const config = getConfig();
const routes = getRoutes(config);

const app = express();
app.set('trust proxy', true);
app.use(cors({
  origin: config.baseUrl,
}));

const ajv = new Ajv({
  coerceTypes: 'array',
});
addFormats(ajv);

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
 *   altcha?: string,
 * }} ValidSubmission
 * 
 * @typedef {object} UserData
 * @property {string} ip
 *   IP of the user. We mostly just want to check if certain IPs seem to be
 *   spamming form submissions. Sometimes this is normal, such as corporate IPs
 *   or VPNs, but most of the time it's probably going to be a malicious user.
 * @property {string} userAgent
 *   Device/browser combination of the user. If we receive spam, we may ignore
 *   responses based on user-agent instead of IP. A lot of spam can be
 *   distributed these days, but somehow they often still use really old
 *   user-agents.
 * @property {string} referer
 *   What website directed the user to this form. Will mostly be svgo.dev, but
 *   could be from a note taking app, AI chat, or empty if they transition
 *   device to complete the form on their form, etc. This will help us find if
 *   the form is being linked from elsewhere though.
 * 
 * @typedef {object} SubmissionRecord
 * @property {Omit<ValidSubmission, 'altcha'>} form
 * @property {any} user
 * @property {boolean} verified
 *   Validated form data but with a flag to indicate if the user successfully
 *   completed the captcha. We still accept submissions if the captcha is not
 *   completed, but set `verified` to false to denote that it is less
 *   trustworthy.
 */

/** @type {import('ajv').JSONSchemaType<ValidSubmission>} */
const schema = {
  type: 'object',
  properties: {
    ageBand: SINGLE_CHOICE,
    impressionOfWebsite: LIKERT,
    websiteTrust: LIKERT,
    websiteKeywords: MULTIPLE_CHOICE,
    'websiteKeywords-other': TEXT_FIELD,
    promptFrequency: SINGLE_CHOICE,
    feelingTowardsPrompts: LIKERT,
    promptEffectsImpression: LIKERT,
    promptImpression: MULTIPLE_CHOICE,
    'promptImpression-other': TEXT_FIELD,
    promptTrust: LIKERT,
    isCompliant: SINGLE_CHOICE,
    promptInfluence: MULTIPLE_CHOICE,
    'promptInfluence-other': TEXT_FIELD,
    promptAutomation: MULTIPLE_CHOICE,
    'promptAutomation-other': TEXT_FIELD,
    'anythingElse': TEXT_AREA,
    'email': {
      ...TEXT_FIELD,
      format: 'email',
    },
    altcha: { type: 'string', nullable: true },
  },
  additionalProperties: false,
};

app.use(express.urlencoded({ extended: true }));

app.get('/challenge', async (req, res) => {
  const challenge = await createChallenge({
    hmacKey: config.secret,
    maxNumber: 150000,
  });

  res.json(challenge);
});

app.post('/submit', async (req, res) => {
  const formData = req.body;
  const altchaToken = formData.altcha;
  let verified = false;

  if (altchaToken) {
    verified = await verifySolution(String(altchaToken), config.secret);

    if (!verified) {
      res.status(400);
      return;
    }
  }

  const isValid = validateSubmission(formData);

  if (!isValid) {
    res.status(400);
    return;
  }

  const submission = mapSubmission(req, formData, verified);
  console.log(submission);
  res.redirect(routes.THANK_YOU);
});

/**
 * @param {Record<string, string|string[]>} data
 * @returns {data is ValidSubmission}
 */
function validateSubmission(data) {
  for (const k in data) {
    if (data[k] === '') {
      delete data[k];
    }
  }

  const validate = ajv.compile(schema);
  return validate(data);
}

/**
 * @param {import('express').Request} req
 * @param {ValidSubmission} data
 * @param {boolean} verified
 * @returns {SubmissionRecord}
 */
function mapSubmission(req, data, verified) {
  const { altcha, ...rest } = data;

  return {
    form: rest,
    user: {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer'],
    },
    verified,
  };
}

app.listen(config.port, () => {
  console.log(`Started web server in ${config.env} mode on port ${config.port}.`);
});
