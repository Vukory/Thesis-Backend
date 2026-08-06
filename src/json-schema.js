/**
 * @fileoverview Reusable JSON Schema definitions.
 */

/** Scale of 1 to 5. */
export const LIKERT = /** @type {const} */ ({
  type: 'integer',
  minimum: 1,
  maximum: 5,
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

/**
 * @param {string[]} options
 * @param {boolean} other
 * @returns {any}
 */
export function multipleChoiceSchema(options, other) {
  return {
    type: 'array',
    maxItems: other ? options.length + 1 : options.length,
    uniqueItems: true,
    items: {
      enum: other ? [...options, 'other'] : options,
    },
    nullable: true
  }
}

/**
 * @param {string[]} options
 * @returns {any}
 */
export function singleChoiceSchema(options) {
  return {
    type: 'string',
    enum: options,
    nullable: true
  }
}
