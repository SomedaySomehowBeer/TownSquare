/**
 * Shared settle-zone geometry for scene props.
 *
 * Prop `width` is a normalized fraction of stage width (0–1). The settle band
 * matches the painted prop: half-width on each side of `x`.
 */

/**
 * @typedef {import("./site-config.mjs").SceneProp} SceneProp
 */

/**
 * @param {SceneProp} prop
 * @returns {number}
 */
export function propSettleHalfWidth(prop) {
  return prop.pose && prop.width > 0 ? prop.width / 2 : 0;
}

/**
 * @param {SceneProp} prop
 * @param {number} x
 * @returns {boolean}
 */
export function isWithinPropSettleZone(prop, x) {
  const half = propSettleHalfWidth(prop);
  return half > 0 && Math.abs(x - prop.x) < half;
}

/**
 * @param {Array<SceneProp>} props
 * @param {number} x
 * @returns {SceneProp | undefined}
 */
export function findSettleProp(props, x) {
  return props.find((prop) => isWithinPropSettleZone(prop, x));
}
