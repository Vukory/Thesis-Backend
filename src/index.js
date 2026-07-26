#!/usr/bin/env node

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { createChallenge, verifySolution } from 'altcha-lib';
import cors from 'cors';
import express from 'express';
import { getConfig } from './config.js';
import { LIKERT, multipleChoiceSchema, singleChoiceSchema, TEXT_AREA, TEXT_FIELD } from './json-schema.js';
import { getPages } from './pages.js';
import { saveSubmission } from './submission.js';
import survey from './survey.json' with {type: 'json'};

const config = getConfig();
const pages = getPages(config);

const app = express();
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: config.baseUrl,
}));

const ajv = new Ajv({
  coerceTypes: 'array',
});
addFormats(ajv);

/** @type {import('ajv').JSONSchemaType<import('./submission.js').SubmissionData>} */
const schema = {
  type: 'object',
  properties: {
    ageBand: singleChoiceSchema(survey.ageBand),
    techExpertise: singleChoiceSchema(survey.techExpertise),
    visitFrequency: singleChoiceSchema(survey.visitFrequency),
    bannerEmotion: multipleChoiceSchema(survey.bannerEmotion, true),
    'bannerEmotion-other': TEXT_FIELD,
    bannerImpression: multipleChoiceSchema(survey.bannerImpression, true),
    'bannerImpression-other': TEXT_FIELD,
    bannerAppeal: LIKERT,
    bannerComplexity: LIKERT,
    bannerUnderstanding: LIKERT,
    bannerTrustEffect: LIKERT,
    bannerCompliance: singleChoiceSchema(survey.bannerCompliance),
    bannerDecisionFactors: multipleChoiceSchema(survey.bannerDecisionFactors, true),
    'bannerDecisionFactors-other': TEXT_FIELD,
    bannerIntegration: LIKERT,
    websiteImpression: LIKERT,
    websiteTrust: LIKERT,
    websiteTone: multipleChoiceSchema(survey.websiteTone, true),
    'websiteTone-other': TEXT_FIELD,
    generalBannerAttitude: LIKERT,
    generalBannerImpact: LIKERT,
    blockingTools: multipleChoiceSchema(survey.blockingTools, true),
    'blockingTools-other': TEXT_FIELD,
    openFeedback: TEXT_AREA,
    email: {
      ...TEXT_FIELD,
      format: 'email',
    },
    utm_content: {
      type: 'string',
      enum: ['a', 'b', 'c'],
      nullable: true,
    },
  },
  additionalProperties: false,
};

app.get('/challenge', async (req, res) => {
  const challenge = await createChallenge({
    hmacKey: config.secret,
    maxNumber: 150000,
  });

  res.json(challenge);
});

app.post('/submit', async (req, res) => {
  const body = /** @type {any} */ (req).body;
  const query = req.query;

  const formData = { ...body };

  if (typeof query.utm_content === 'string') {
    formData.utm_content = query.utm_content;
  }

  for (const k of Object.keys(formData)) {
    if (formData[k] === '') {
      delete formData[k];
    }
  }

  const altchaToken = formData.altcha;
  let verified = false;

  if (altchaToken) {
    verified = await verifySolution(String(altchaToken), config.secret);

    if (!verified) {
      res.status(403).send('You seem like a robot! 🤖');
      return;
    }

    delete formData.altcha;
  }

  const isValid = validateSubmission(formData);

  if (!isValid) {
    res.status(400).send('Form is malformed or invalid.');
    return;
  }

  const submission = mapSubmission(req, formData, verified);

  try {
    await saveSubmission(submission);
  } catch (err) {
    res.status(500).json({
      message: 'Sorry! We failed to save your response. Here\'s your submission, could you please try again later or save this page and email it to hi@vukory.art?',
      form: formData,
    });
    console.error('Failed to save form submission.', err);
    return;
  }

  res.redirect(pages.THANK_YOU);
});

/**
 * @param {Record<string, string|string[]>} data
 * @returns {data is import('./submission.js').SubmissionData}
 */
function validateSubmission(data) {
  const validate = ajv.compile(schema);
  const isValid = validate(data);

  if (!isValid) {
    console.warn('Received invalid form submission.');
    console.warn(validate.errors);
  }

  return isValid;
}

/**
 * @param {import('express').Request} req
 * @param {import('./submission.js').SubmissionData} data
 * @param {boolean} verified
 * @returns {import('./submission.js').SubmissionRecord}
 */
function mapSubmission(req, data, verified) {
  return {
    form: data,
    user: {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer'],
    },
    date: new Date(),
    verified,
  };
}

app.listen(config.port, () => {
  console.log(`Started web server in ${config.env} mode on port ${config.port}.`);
});
