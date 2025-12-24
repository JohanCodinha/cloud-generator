/**
 * Calculate centroid of all circle anchors
 */
export const getCentroid = (circles) => {
  if (circles.length === 0) return { x: 400, y: 300 };
  const sumX = circles.reduce((sum, c) => sum + c.anchorX, 0);
  const sumY = circles.reduce((sum, c) => sum + c.anchorY, 0);
  return { x: sumX / circles.length, y: sumY / circles.length };
};

/**
 * Calculate Global Motion Offset at time T
 */
export const calculateGlobalOffset = (t, config) => {
  const loopProgress = t / config.loopDuration;
  const globalTheta = loopProgress * Math.PI * 2 * config.globalOrbitSpeed;
  let gRawX, gRawY;

  if (config.globalPattern === 'line') {
    const sine = Math.sin(globalTheta);
    gRawX = config.globalOrbitRx * sine;
    gRawY = 0;
  } else {
    gRawX = config.globalOrbitRx * Math.cos(globalTheta);
    gRawY = config.globalOrbitRy * Math.sin(globalTheta);
  }

  const gRotRad = (config.globalOrbitRotation * Math.PI) / 180;
  const globalOffsetX = gRawX * Math.cos(gRotRad) - gRawY * Math.sin(gRotRad);
  const globalOffsetY = gRawX * Math.sin(gRotRad) + gRawY * Math.cos(gRotRad);

  return { x: globalOffsetX, y: globalOffsetY };
};

/**
 * Calculate bounding box for circles with padding
 */
export const getBoundingBox = (currentCircles, config, paddingMultiplier = 1) => {
  if (currentCircles.length === 0) return { x: 0, y: 0, w: 100, h: 100 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  // Calculate global motion expansion
  const globalExp = config.animate ? Math.max(config.globalOrbitRx, config.globalOrbitRy) : 0;

  currentCircles.forEach(c => {
    const orbitExp = c.isAnimated ? Math.max(c.orbitRx, c.orbitRy) : 0;
    const radiusExp = c.radiusAnim ? c.maxR : c.r;

    minX = Math.min(minX, c.anchorX - radiusExp - orbitExp - globalExp);
    minY = Math.min(minY, c.anchorY - radiusExp - orbitExp - globalExp);
    maxX = Math.max(maxX, c.anchorX + radiusExp + orbitExp + globalExp);
    maxY = Math.max(maxY, c.anchorY + radiusExp + orbitExp + globalExp);
  });

  const basePadding = config.blur * 2 + 20;
  const padding = basePadding * paddingMultiplier;

  return {
    x: minX - padding,
    y: minY - padding,
    w: (maxX - minX) + (padding * 2),
    h: (maxY - minY) + (padding * 2)
  };
};

/**
 * Constrain a circle position to maintain shape integrity
 */
export const constrainPosition = (targetX, targetY, circle, allCircles, constraintActive) => {
  if (!constraintActive || allCircles.length <= 1) return { x: targetX, y: targetY };

  let isOverlapping = false;
  let nearestDist = Infinity;
  let nearestNeighbor = null;
  const neighbors = allCircles.filter(c => c.id !== circle.id);

  const currentR = circle.currentR || circle.r;

  for (let n of neighbors) {
    const dist = Math.sqrt(Math.pow(targetX - n.x, 2) + Math.pow(targetY - n.y, 2));
    const neighborR = n.currentR || n.r;
    const minDist = currentR + neighborR;
    const limit = minDist * 0.95;

    if (dist < limit) {
      isOverlapping = true;
      break;
    }
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestNeighbor = n;
    }
  }

  if (isOverlapping) return { x: targetX, y: targetY };

  if (nearestNeighbor) {
    const neighborR = nearestNeighbor.currentR || nearestNeighbor.r;
    const angle = Math.atan2(targetY - nearestNeighbor.y, targetX - nearestNeighbor.x);
    const limit = (currentR + neighborR) * 0.95;
    return {
      x: nearestNeighbor.x + Math.cos(angle) * limit,
      y: nearestNeighbor.y + Math.sin(angle) * limit
    };
  }

  return { x: targetX, y: targetY };
};

/**
 * Calculate individual circle position based on animation
 */
export const calculateCirclePosition = (circle, time, config, globalOffset) => {
  let targetX = circle.anchorX;
  let targetY = circle.anchorY;

  // Add Individual Motion
  if (circle.isAnimated) {
    const loopProgress = time / config.loopDuration;
    const theta = circle.phase + (loopProgress * Math.PI * 2 * circle.orbitSpeed);
    let rawX, rawY;

    if (circle.pattern === 'line') {
      const sine = Math.sin(theta);
      rawX = circle.orbitRx * sine;
      rawY = 0;
    } else {
      rawX = circle.orbitRx * Math.cos(theta);
      rawY = circle.orbitRy * Math.sin(theta);
    }

    const rotRad = (circle.orbitRotation * Math.PI) / 180;
    const rotatedX = rawX * Math.cos(rotRad) - rawY * Math.sin(rotRad);
    const rotatedY = rawX * Math.sin(rotRad) + rawY * Math.cos(rotRad);
    targetX += rotatedX;
    targetY += rotatedY;
  }

  // Add Global Motion
  targetX += globalOffset.x;
  targetY += globalOffset.y;

  return { x: targetX, y: targetY };
};

/**
 * Calculate animated radius for a circle
 */
export const calculateAnimatedRadius = (circle, time, config) => {
  if (!circle.radiusAnim) return circle.r;

  const loopProgress = time / config.loopDuration;
  const theta = circle.radiusPhase + (loopProgress * Math.PI * 2 * circle.radiusSpeed);
  const sine = (Math.sin(theta) + 1) / 2;
  return circle.minR + (circle.maxR - circle.minR) * sine;
};
