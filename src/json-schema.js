/**
 * @fileoverview Reusable JSON Schema definitions.
 */

/** Scale of 1 to 5. */
export const LIKERT = /** @type {const} */ ({
  type: 'number',
  minimum: 1,
  maximum: 5,
  nullable: true
});

export const MULTIPLE_CHOICE = /** @type {const} */ ({
  type: 'array',
  maxItems: 16,
  items: {
    type: 'string',
    maxLength: 100,
  },
  nullable: true
});

export const SINGLE_CHOICE = /** @type {const} */ ({
  type: 'string',
  maxLength: 100,
  nullable: true
});

export const TEXT_FIELD = /** @type {const} */ ({
  type: 'string',
  maxLength: 100,
  nullable: true
});

export const TEXT_AREA = /** @type {const} */ ({
  type: 'string',
  maxLength: 1024,
  nullable: true
});
