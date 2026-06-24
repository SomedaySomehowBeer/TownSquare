/**
 * Someday Somehow profile silhouette rig.
 *
 * A side-on (profile) figure drawn as a bold, single-colour silhouette: each
 * limb is a fat, round-capped <line> (a round cap renders a line as a rounded
 * capsule) and the head is a filled circle. The joint-group structure and
 * names are unchanged from the upstream stick figure, so every walk / sit /
 * rest / jump / high-five keyframe in widget.css still drives it untouched.
 *
 * The transform-origins in widget.css MUST match the rest-pose joint
 * coordinates below. Proportions tuned 2026-06 (chunky: big head set high,
 * short stout torso, uniform-width arms + legs).
 *
 * Limb classes (used by widget.css for stroke weight): torso | limb | fore |
 * foot. The `far` class on the off-side arm/leg lets widget.css paint them a
 * lighter, receding shade.
 *
 * @param {string} [svgAttributes] Extra attributes for the root svg tag.
 * @returns {string}
 */
export function figureMarkup(svgAttributes = "") {
  return `
    <svg viewBox="0 0 20 44" preserveAspectRatio="xMidYMax meet" ${svgAttributes}>
      <g class="figure-core">
        <g class="joint arm-r far">
          <line class="limb" x1="9.6" y1="16" x2="9.6" y2="22.24"></line>
          <g class="joint elbow-r"><line class="fore" x1="9.6" y1="22.24" x2="9.6" y2="28"></line></g>
        </g>
        <g class="joint leg-r far">
          <line class="limb" x1="9.6" y1="26.8" x2="9.6" y2="33.05"></line>
          <g class="joint knee-r">
            <line class="limb" x1="9.6" y1="33.05" x2="9.6" y2="39.3"></line>
            <line class="foot" x1="9.6" y1="39.3" x2="11.6" y2="39.9"></line>
          </g>
        </g>
        <line class="torso" x1="10" y1="14.8" x2="10" y2="26.8"></line>
        <circle class="head" cx="10" cy="6.6" r="4.6"></circle>
        <g class="joint leg-l">
          <line class="limb" x1="10.4" y1="26.8" x2="10.4" y2="33.05"></line>
          <g class="joint knee-l">
            <line class="limb" x1="10.4" y1="33.05" x2="10.4" y2="39.3"></line>
            <line class="foot" x1="10.4" y1="39.3" x2="12.4" y2="39.9"></line>
          </g>
        </g>
        <g class="joint arm-l">
          <line class="limb" x1="10.4" y1="16" x2="10.4" y2="22.24"></line>
          <g class="joint elbow-l"><line class="fore" x1="10.4" y1="22.24" x2="10.4" y2="28"></line></g>
        </g>
      </g>
    </svg>
  `;
}
