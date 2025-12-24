import { getBoundingBox } from './geometry';

/**
 * Generate SVG string for export
 */
export const getSVGString = (circles, config, lockedExportBox) => {
  if (circles.length === 0) return '<svg></svg>';

  const box = lockedExportBox || getBoundingBox(circles, config, 1.2);
  const vbX = box.x.toFixed(1);
  const vbY = box.y.toFixed(1);
  const vbW = box.w.toFixed(1);
  const vbH = box.h.toFixed(1);

  // Generate Inner Elements (Circles)
  const elements = circles.map(c => {
    let radiusAttribute = `r="${c.r}"`;
    let radiusAnimateTag = "";

    if (config.exportAnimated && c.radiusAnim && c.radiusSpeed > 0) {
      const speed = c.radiusSpeed * config.globalSpeed;
      const rDuration = (config.loopDuration / speed).toFixed(3);
      const rPhaseRatio = (c.radiusPhase % (Math.PI * 2)) / (Math.PI * 2);
      const rBegin = -1 * rPhaseRatio * rDuration;

      radiusAttribute = `r="${c.minR}"`;
      radiusAnimateTag = `
        <animate
           attributeName="r"
           values="${c.minR};${c.maxR};${c.minR}"
           dur="${rDuration}s"
           repeatCount="indefinite"
           calcMode="spline"
           keyTimes="0;0.5;1"
           keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
           begin="${rBegin.toFixed(3)}s"
        />`;
    } else if (c.radiusAnim) {
      radiusAttribute = `r="${(c.minR + c.maxR) / 2}"`;
    }

    if (!config.exportAnimated || !c.isAnimated) {
      const staticR = c.radiusAnim ? (c.minR + c.maxR) / 2 : c.r;
      return `    <circle cx="${c.anchorX.toFixed(1)}" cy="${c.anchorY.toFixed(1)}" r="${staticR}" fill="${config.fillColor}" />`;
    }
    else {
      const duration = (config.loopDuration / (c.orbitSpeed * config.globalSpeed)).toFixed(3);
      const phaseRatio = (c.phase % (Math.PI * 2)) / (Math.PI * 2);
      const beginOffset = -1 * phaseRatio * duration;

      let pathData = "";
      let calcMode = "";
      let keyTimes = "";
      let keySplines = "";

      if (c.pattern === 'line') {
        // Line pattern: Right -> Left -> Right
        pathData = `M ${c.orbitRx.toFixed(1)} 0 L ${-c.orbitRx.toFixed(1)} 0 L ${c.orbitRx.toFixed(1)} 0`;
        // Smooth easing for line
        calcMode = 'calcMode="spline"';
        keyTimes = 'keyTimes="0;0.5;1"';
        keySplines = 'keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"';
      } else {
        // Circle/Oval pattern
        const rx = c.orbitRx.toFixed(1);
        const ry = Math.max(c.orbitRy, 0.1).toFixed(1);
        pathData = `M ${rx} 0 A ${rx} ${ry} 0 1 1 -${rx} 0 A ${rx} ${ry} 0 1 1 ${rx} 0`;
      }

      return `    <g transform="translate(${c.anchorX.toFixed(1)}, ${c.anchorY.toFixed(1)}) rotate(${c.orbitRotation})">
      <g>
        <animateMotion
          path="${pathData}"
          dur="${duration}s"
          repeatCount="indefinite"
          rotate="0"
          begin="${beginOffset.toFixed(3)}s"
          ${calcMode} ${keyTimes} ${keySplines}
        />
        <circle ${radiusAttribute} fill="${config.fillColor}">${radiusAnimateTag}
        </circle>
      </g>
    </g>`;
    }
  }).join('\n');

  // Wrap in Global Motion Group if needed
  let content = elements;
  if (config.exportAnimated && (config.globalOrbitRx > 0 || config.globalOrbitRy > 0)) {
    const duration = (config.loopDuration / (config.globalOrbitSpeed * config.globalSpeed)).toFixed(3);
    let pathData = "";
    let calcMode = "";
    let keyTimes = "";
    let keySplines = "";

    if (config.globalPattern === 'line') {
      pathData = `M ${config.globalOrbitRx.toFixed(1)} 0 L ${-config.globalOrbitRx.toFixed(1)} 0 L ${config.globalOrbitRx.toFixed(1)} 0`;
      calcMode = 'calcMode="spline"';
      keyTimes = 'keyTimes="0;0.5;1"';
      keySplines = 'keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"';
    } else {
      const rx = config.globalOrbitRx.toFixed(1);
      const ry = Math.max(config.globalOrbitRy, 0.1).toFixed(1);
      pathData = `M ${rx} 0 A ${rx} ${ry} 0 1 1 -${rx} 0 A ${rx} ${ry} 0 1 1 ${rx} 0`;
    }

    content = `  <g transform="rotate(${config.globalOrbitRotation})">
    <g>
      <animateMotion
        path="${pathData}"
        dur="${duration}s"
        repeatCount="indefinite"
        rotate="0"
        ${calcMode} ${keyTimes} ${keySplines}
      />
      <g transform="rotate(${-config.globalOrbitRotation})">
${elements}
      </g>
    </g>
  </g>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" style="background-color: ${config.bgColor}">
  <defs>
    <filter id="goo">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${config.blur}" result="blur" />
      <feColorMatrix
        in="blur"
        mode="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${config.alphaContrast} ${config.alphaShift}"
        result="goo"
      />
      <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
    </filter>
  </defs>
  <g filter="url(#goo)">
${content}
  </g>
</svg>`;
};

/**
 * Copy SVG string to clipboard
 */
export const copyToClipboard = (circles, config, lockedExportBox) => {
  const str = getSVGString(circles, config, lockedExportBox);
  navigator.clipboard.writeText(str);
};
