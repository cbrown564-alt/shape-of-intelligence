import { useEffect, useRef } from 'react';

const TAU = Math.PI * 2;

const fract = (value) => value - Math.floor(value);
const hash = (value) => fract(Math.sin(value * 127.1) * 43758.5453);
const lerp = (a, b, amount) => a + (b - a) * amount;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoothstep = (start, end, value) => {
  const amount = clamp((value - start) / (end - start));
  return amount * amount * (3 - 2 * amount);
};

const palette = {
  primary: '94, 130, 255',
  life: '112, 231, 125',
  human: '255, 119, 91',
  alien: '245, 218, 72',
  sand: '202, 178, 133',
};

function mixTarget(from, to, amount) {
  return {
    x: lerp(from.x, to.x, amount),
    y: lerp(from.y, to.y, amount),
    color: amount < 0.52 ? from.color : to.color,
    alpha: lerp(from.alpha, to.alpha, amount),
    path: lerp(from.path ?? 0, to.path ?? 0, amount),
  };
}

function sandPoint(index, count, width, height, time) {
  const h1 = hash(index + 1.37);
  const h2 = hash(index * 2.13 + 8.4);
  const h3 = hash(index * 4.91 + 3.1);
  const min = Math.min(width, height);
  const centreX = width * 0.7;

  if (index === 0) {
    return {
      x: centreX,
      y: height * 0.61,
      color: 'alien',
      alpha: 1,
      path: 0,
    };
  }

  const falling = h3 > 0.79;
  if (falling) {
    return {
      x: centreX + (h1 - 0.5) * min * 0.17,
      y: (h2 * height * 0.78 + time * (34 + h1 * 44)) % (height * 0.8),
      color: h2 > 0.93 ? 'alien' : 'sand',
      alpha: 0.3 + h2 * 0.55,
      path: h2,
    };
  }

  const spread = (h1 - 0.5) * min * 0.58;
  const distanceFromCentre = Math.abs(spread) / (min * 0.29);
  const pileHeight = Math.max(0.02, 1 - distanceFromCentre) * min * 0.24;
  return {
    x: centreX + spread,
    y: height * 0.79 - h2 * pileHeight + (h3 - 0.5) * 3,
    color: h3 > 0.94 ? 'alien' : 'sand',
    alpha: 0.35 + h2 * 0.58,
    path: h1,
  };
}

function siliconPoint(index, count, width, height) {
  const min = Math.min(width, height);
  const centreX = width * 0.7;
  const centreY = height * 0.5;

  if (index === 0) {
    return { x: centreX, y: centreY, color: 'alien', alpha: 1, path: 0.5 };
  }

  const columns = 29;
  const rows = Math.ceil((count - 1) / columns);
  const local = index - 1;
  const column = local % columns;
  const row = Math.floor(local / columns);
  const spacing = min * 0.0175;
  const x = centreX + (column - (columns - 1) / 2) * spacing + (row % 2) * spacing * 0.5;
  const y = centreY + (row - (rows - 1) / 2) * spacing * 0.88;

  return {
    x,
    y,
    color: (column + row) % 11 === 0 ? 'alien' : 'primary',
    alpha: 0.38 + hash(index * 3.17) * 0.57,
    path: (column + row) / (columns + rows - 2),
  };
}

function neuralPoint(index, count, width, height) {
  const h1 = hash(index + 1.37);
  const h2 = hash(index * 2.13 + 8.4);
  const min = Math.min(width, height);
  const rootX = width * 0.56;
  const rootY = height * 0.5;

  if (index === 0) {
    return { x: rootX, y: rootY, color: 'alien', alpha: 1, path: 0 };
  }

  const somaCount = Math.floor(count * 0.17);
  if (index < somaCount) {
    const local = index / somaCount;
    const angle = local * TAU * 9 + h1 * 0.3;
    const radius = Math.sqrt(h2) * min * 0.072 * (0.76 + 0.18 * Math.sin(angle * 3));
    return {
      x: rootX + Math.cos(angle) * radius,
      y: rootY + Math.sin(angle) * radius,
      color: h1 > 0.72 ? 'life' : 'primary',
      alpha: 0.32 + h2 * 0.62,
      path: 0.04,
    };
  }

  const branches = 13;
  const branch = (index - somaCount) % branches;
  const row = Math.floor((index - somaCount) / branches);
  const rows = Math.ceil((count - somaCount) / branches);
  const depth = row / Math.max(rows - 1, 1);
  const angle = -1.28 + (branch / (branches - 1)) * 2.56;
  const reach = min * (0.25 + (branch % 3) * 0.055);
  const sway = Math.sin(depth * Math.PI * 3 + branch * 0.9) * min * 0.012 * depth;

  return {
    x: rootX + Math.cos(angle) * depth * reach + Math.sin(angle) * sway,
    y: rootY + Math.sin(angle) * depth * reach * 0.9 + Math.cos(angle) * sway,
    color: branch % 4 === 0 ? 'primary' : 'life',
    alpha: 0.25 + h2 * 0.68,
    path: depth,
  };
}

function matterPoint(progress, index, count, width, height, time) {
  const sand = sandPoint(index, count, width, height, time);
  const silicon = siliconPoint(index, count, width, height);
  const neural = neuralPoint(index, count, width, height);

  if (progress <= 0.5) {
    return mixTarget(sand, silicon, smoothstep(0.08, 0.5, progress));
  }
  return mixTarget(silicon, neural, smoothstep(0.5, 0.96, progress));
}

function matterWeights(progress) {
  const siliconIn = smoothstep(0.08, 0.5, progress);
  const neuralIn = smoothstep(0.5, 0.96, progress);
  return {
    sand: 1 - siliconIn,
    silicon: siliconIn * (1 - neuralIn),
    neural: neuralIn,
  };
}

const collectiveDestinations = [
  [-0.31, -0.23],
  [-0.32, 0.18],
  [-0.08, -0.34],
  [0.24, -0.28],
  [0.33, 0.08],
  [0.08, 0.32],
];

const cityBuildings = [
  { x: 0.53, base: 0.61, width: 0.05, height: 0.18, columns: 5, depth: 0 },
  { x: 0.64, base: 0.61, width: 0.07, height: 0.24, columns: 6, depth: 0 },
  { x: 0.76, base: 0.61, width: 0.055, height: 0.16, columns: 5, depth: 0 },
  { x: 0.87, base: 0.61, width: 0.075, height: 0.27, columns: 7, depth: 0 },
  { x: 0.5, base: 0.7, width: 0.08, height: 0.27, columns: 7, depth: 1 },
  { x: 0.63, base: 0.7, width: 0.105, height: 0.2, columns: 9, depth: 1 },
  { x: 0.76, base: 0.7, width: 0.07, height: 0.36, columns: 6, depth: 1 },
  { x: 0.89, base: 0.7, width: 0.1, height: 0.25, columns: 9, depth: 1 },
  { x: 0.53, base: 0.8, width: 0.12, height: 0.31, columns: 10, depth: 2 },
  { x: 0.68, base: 0.8, width: 0.08, height: 0.44, columns: 7, depth: 2 },
  { x: 0.81, base: 0.8, width: 0.13, height: 0.26, columns: 11, depth: 2 },
  { x: 0.92, base: 0.8, width: 0.085, height: 0.37, columns: 7, depth: 2 },
];

function colonyPoint(index, count, width, height, time) {
  const h1 = hash(index + 1.37);
  const h2 = hash(index * 2.13 + 8.4);
  const h3 = hash(index * 4.91 + 3.1);
  const min = Math.min(width, height);
  const centreX = width * 0.66;
  const centreY = height * 0.51;
  const route = index % collectiveDestinations.length;
  const [endX, endY] = collectiveDestinations[route];
  const cycle = fract(h1 + time * (0.035 + h3 * 0.018));
  const progress = 0.5 - 0.5 * Math.cos(cycle * TAU);
  const bend = (route % 2 ? 1 : -1) * min * (0.04 + route * 0.005);
  const controlX = centreX + endX * min * 0.46 - endY * bend;
  const controlY = centreY + endY * min * 0.46 + endX * bend;
  const targetX = centreX + endX * min;
  const targetY = centreY + endY * min;
  const inverse = 1 - progress;
  const jitter = (h2 - 0.5) * 5;

  return {
    x: inverse * inverse * centreX + 2 * inverse * progress * controlX + progress * progress * targetX + jitter,
    y: inverse * inverse * centreY + 2 * inverse * progress * controlY + progress * progress * targetY - jitter * 0.4,
    color: cycle > 0.48 && cycle < 0.53 ? 'alien' : 'life',
    alpha: 0.3 + h2 * 0.68,
    path: progress,
  };
}

function flockPoint(index, count, width, height, time) {
  const bird = Math.floor(index / 7);
  const feather = index % 7;
  const h1 = hash(bird + 1.37);
  const h2 = hash(bird * 2.13 + 8.4);
  const h3 = hash(bird * 4.91 + 3.1);
  const min = Math.min(width, height);
  const turn = Math.sin(time * 0.24) * 0.34;
  const spreadX = (h1 - 0.5) * min * 0.72;
  const envelope = 1 - Math.abs(h1 - 0.5) * 0.75;
  const spreadY = (h2 - 0.5) * min * 0.34 * envelope;
  const wave = Math.sin(h1 * TAU * 2.4 + time * 0.42) * min * 0.035;
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  const centreX = width * 0.67 + Math.sin(time * 0.13) * min * 0.055;
  const centreY = height * 0.5 + Math.cos(time * 0.17) * min * 0.045;
  const baseX = centreX + spreadX * cos - (spreadY + wave) * sin;
  const baseY = centreY + spreadX * sin + (spreadY + wave) * cos;
  const wing = feather < 3 ? -1 : feather > 3 ? 1 : 0;
  const wingStep = feather < 3 ? 3 - feather : feather > 3 ? feather - 3 : 0;
  const wingBeat = 0.55 + 0.45 * Math.sin(time * (2.1 + h3) + h1 * TAU);
  const localX = wing * wingStep * (1.7 + h3 * 0.8);
  const localY = -wingStep * (1.1 + wingBeat * 1.5);

  return {
    x: baseX + localX * cos - localY * sin,
    y: baseY + localX * sin + localY * cos,
    color: bird % 11 === 0 ? 'alien' : 'life',
    alpha: 0.36 + h2 * 0.6,
    path: h1,
  };
}

function fungusPoint(index, count, width, height, time) {
  const h1 = hash(index + 1.37);
  const h2 = hash(index * 2.13 + 8.4);
  const min = Math.min(width, height);
  const branches = 16;
  const branch = index % branches;
  const row = Math.floor(index / branches);
  const rows = Math.ceil(count / branches);
  const depth = row / Math.max(rows - 1, 1);
  const angle = (branch / branches) * TAU - 0.42;
  const rootX = width * 0.66;
  const rootY = height * 0.51;
  const trunkEnd = 0.46;
  const trunkDepth = Math.min(depth / trunkEnd, 1);
  const reach = min * (0.2 + (branch % 5) * 0.026);
  const junctionX = rootX + Math.cos(angle) * reach;
  const junctionY = rootY + Math.sin(angle) * reach * 0.78;
  const childDepth = Math.max(0, (depth - trunkEnd) / (1 - trunkEnd));
  const split = (h1 > 0.5 ? 1 : -1) * (0.34 + h2 * 0.4);
  const childAngle = angle + split;
  const childReach = min * (0.09 + h2 * 0.13);
  const pulse = Math.abs(fract(time * 0.09) - depth) < 0.045;

  return {
    x: depth <= trunkEnd
      ? lerp(rootX, junctionX, trunkDepth)
      : junctionX + Math.cos(childAngle) * childReach * childDepth,
    y: depth <= trunkEnd
      ? lerp(rootY, junctionY, trunkDepth)
      : junctionY + Math.sin(childAngle) * childReach * childDepth * 0.8,
    color: pulse ? 'alien' : 'life',
    alpha: 0.24 + h2 * 0.7,
    path: depth,
  };
}

function scentPoint(index, width, height, time) {
  const h1 = hash(index + 1.37);
  const h2 = hash(index * 2.13 + 8.4);
  const h3 = hash(index * 4.91 + 3.1);
  const min = Math.min(width, height);
  const distance = fract(h1 * 0.86 + time * (0.018 + h3 * 0.018));
  const angle = h2 * TAU * 3 + time * 0.08;
  const curl = Math.sin(distance * TAU * 2.2 + h2 * TAU) * min * 0.07;
  return {
    x: width * 0.53 + distance * width * 0.42 + Math.cos(angle) * min * 0.05 * distance,
    y: height * 0.5 + (h2 - 0.5) * min * 0.4 * distance + curl,
    color: h3 > 0.48 ? 'human' : 'alien',
    alpha: 0.18 + (1 - distance) * 0.78,
    path: distance,
  };
}

function alienSensePoint(variant, index, count, width, height, time) {
  const u = index / count;
  const h1 = hash(index + 1.37);
  const h2 = hash(index * 2.13 + 8.4);
  const h3 = hash(index * 4.91 + 3.1);
  const min = Math.min(width, height);
  const centreX = width * 0.7;
  const centreY = height * 0.5;

  if (variant === 0) {
    const angle = u * TAU * 3;
    const radius = min * (0.12 + h2 * 0.19);
    const eye = index % 19 === 0;
    return {
      x: eye ? width * (0.65 + (index % 2) * 0.08) : centreX + Math.cos(angle) * radius * 0.72,
      y: eye ? height * 0.44 : height * 0.49 + Math.sin(angle) * radius,
      color: eye || h3 > 0.68 ? 'human' : 'alien',
      alpha: 0.32 + h1 * 0.62,
      path: u,
    };
  }

  if (variant === 1) {
    const strand = index % 16;
    const x = width * 0.48 + u * width * 0.44;
    return {
      x,
      y: centreY + Math.sin(u * TAU * (2 + strand * 0.12) + strand + time * 0.32) * min * (0.04 + strand * 0.008),
      color: strand % 5 === 0 ? 'alien' : 'primary',
      alpha: 0.28 + h2 * 0.65,
      path: u,
    };
  }

  if (variant === 2) {
    const buildingIndex = index % cityBuildings.length;
    const building = cityBuildings[buildingIndex];
    const localIndex = Math.floor(index / cityBuildings.length);
    const particlesPerBuilding = Math.ceil(count / cityBuildings.length);
    const rows = Math.ceil(particlesPerBuilding / building.columns);
    const column = localIndex % building.columns;
    const row = Math.floor(localIndex / building.columns);
    const rowProgress = row / Math.max(rows - 1, 1);
    const columnProgress = column / Math.max(building.columns - 1, 1) - 0.5;
    const tiered = buildingIndex % 3 === 1;
    const setback = tiered
      ? rowProgress > 0.72 ? 0.62 : rowProgress > 0.46 ? 0.82 : 1
      : 1 - rowProgress * (buildingIndex % 4 === 2 ? 0.16 : 0.04);
    const layerScale = 0.78 + building.depth * 0.12;
    const flicker = fract(h1 + time * (0.035 + h2 * 0.025));
    const litWindow = (column + row * 2 + buildingIndex) % 7 === 0;
    const traffic = row < 3 && flicker > 0.76;
    return {
      x: width * building.x + columnProgress * min * building.width * setback * layerScale,
      y: height * building.base - rowProgress * min * building.height * layerScale,
      color: traffic ? 'human' : litWindow ? 'alien' : 'primary',
      alpha: 0.34 + building.depth * 0.1 + h1 * 0.42,
      path: (building.depth + rowProgress) / 3,
      scale: 1.2 + building.depth * 0.18,
    };
  }

  if (variant === 3) {
    const radius = u * min * 0.43;
    const angle = u * TAU * 14 - time * 0.16;
    return {
      x: centreX + Math.cos(angle) * radius,
      y: centreY + Math.sin(angle) * radius * 0.7,
      color: h2 > 0.7 ? 'human' : 'primary',
      alpha: 0.26 + u * 0.7,
      path: u,
    };
  }

  const band = index % 12;
  const angle = u * TAU * 9 + Math.sin(time * 0.26) * 0.16;
  const pressure = 1 + Math.sin(time * 0.7 + band * 0.55) * 0.12;
  return {
    x: centreX + Math.cos(angle) * min * (0.1 + band * 0.025) * pressure,
    y: centreY + Math.sin(angle) * min * (0.065 + band * 0.018) * pressure,
    color: band % 4 === 0 ? 'alien' : 'primary',
    alpha: 0.22 + h3 * 0.65,
    path: u,
  };
}

function shapePoint(scene, variant, collectivePhase, storyProgress, index, count, width, height, time) {
  const u = index / count;
  const h1 = hash(index + 1.37);
  const h2 = hash(index * 2.13 + 8.4);
  const h3 = hash(index * 4.91 + 3.1);
  const min = Math.min(width, height);

  if (scene === 0) {
    const angle = u * TAU * 8 + h1 * 0.22;
    const shell = 0.22 + h2 * 0.82;
    const pulse = 1 + Math.sin(time * 0.75 + h3 * 7) * 0.055;
    const radius = min * 0.31 * shell * pulse;
    const wobble = 1 + 0.12 * Math.sin(angle * 3 + time * 0.4);
    return {
      x: width * 0.69 + Math.cos(angle) * radius * wobble,
      y: height * 0.51 + Math.sin(angle) * radius * 0.82,
      color: h1 > 0.84 ? 'alien' : h2 > 0.72 ? 'life' : 'primary',
      alpha: 0.28 + shell * 0.7,
      path: u,
    };
  }

  if (scene === 1) return matterPoint(storyProgress, index, count, width, height, time);

  if (scene === 2) {
    const lobe = h1 > 0.5 ? 1 : -1;
    const angle = h2 * TAU;
    const radius = Math.sqrt(h3);
    const cx = width * 0.7 + lobe * min * 0.092;
    const cy = height * 0.48;
    const groove = 0.72 + 0.18 * Math.sin(angle * 5 + h1 * 8);
    return {
      x: cx + Math.cos(angle) * min * 0.22 * radius * groove,
      y: cy + Math.sin(angle) * min * 0.29 * radius,
      color: h2 > 0.66 ? 'life' : h3 > 0.86 ? 'human' : 'primary',
      alpha: 0.18 + radius * 0.75,
      path: radius,
    };
  }

  if (scene === 3) {
    if (collectivePhase === 0) return colonyPoint(index, count, width, height, time);
    if (collectivePhase === 1) return flockPoint(index, count, width, height, time);
    return fungusPoint(index, count, width, height, time);
  }

  if (scene === 4) return scentPoint(index, width, height, time);

  if (scene === 5) return alienSensePoint(variant, index, count, width, height, time);

  const angle = u * TAU * 13 + time * 0.04;
  const radius = min * (0.07 + h2 * 0.38);
  return {
    x: width * 0.68 + Math.cos(angle) * radius,
    y: height * 0.5 + Math.sin(angle * 1.07) * radius * 0.72,
    color: ['primary', 'life', 'human', 'alien'][index % 4],
    alpha: 0.24 + h1 * 0.7,
    path: u,
  };
}

function drawSiliconStructure(context, width, height, alpha, pulsePhase) {
  if (alpha < 0.01) return;
  const min = Math.min(width, height);
  const spacing = min * 0.045;
  const centreX = width * 0.7;
  const centreY = height * 0.5;
  const columns = 11;
  const rows = 9;

  context.save();
  context.globalCompositeOperation = 'source-over';
  context.lineWidth = 0.75;
  context.strokeStyle = `rgba(94, 130, 255, ${0.2 * alpha})`;
  context.beginPath();
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = centreX + (column - (columns - 1) / 2) * spacing + (row % 2) * spacing * 0.5;
      const y = centreY + (row - (rows - 1) / 2) * spacing * 0.88;
      if (column < columns - 1) {
        context.moveTo(x, y);
        context.lineTo(x + spacing, y);
      }
      if (row < rows - 1) {
        context.moveTo(x, y);
        context.lineTo(x + spacing * 0.5, y + spacing * 0.88);
      }
    }
  }
  context.stroke();

  const traceStartX = centreX - spacing * 4.5;
  const traceY = centreY + spacing * 0.88;
  context.strokeStyle = `rgba(245, 218, 72, ${0.22 * alpha})`;
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(traceStartX, traceY);
  context.lineTo(centreX - spacing * 1.5, traceY);
  context.lineTo(centreX, centreY);
  context.lineTo(centreX + spacing * 2, centreY);
  context.lineTo(centreX + spacing * 4.5, centreY - spacing * 0.88);
  context.stroke();

  if (pulsePhase !== null) {
    const pulseX = lerp(traceStartX, centreX + spacing * 4.5, pulsePhase);
    const pulseY = traceY - Math.max(0, pulsePhase - 0.52) * spacing * 1.84;
    context.fillStyle = `rgba(245, 218, 72, ${0.9 * alpha})`;
    context.beginPath();
    context.arc(pulseX, pulseY, 3.2, 0, TAU);
    context.fill();
  }
  context.restore();
}

function drawNeuralStructure(context, width, height, alpha, pulsePhase) {
  if (alpha < 0.01) return;
  const min = Math.min(width, height);
  const rootX = width * 0.56;
  const rootY = height * 0.5;

  context.save();
  context.globalCompositeOperation = 'source-over';
  context.lineCap = 'round';
  context.strokeStyle = `rgba(112, 231, 125, ${0.17 * alpha})`;
  context.lineWidth = 1.05;

  for (let branch = 0; branch < 13; branch += 1) {
    const angle = -1.28 + (branch / 12) * 2.56;
    const reach = min * (0.25 + (branch % 3) * 0.055);
    const endX = rootX + Math.cos(angle) * reach;
    const endY = rootY + Math.sin(angle) * reach * 0.9;
    const bend = (branch - 6) * min * 0.003;
    context.beginPath();
    context.moveTo(rootX, rootY);
    context.bezierCurveTo(
      lerp(rootX, endX, 0.34), lerp(rootY, endY, 0.2) - bend,
      lerp(rootX, endX, 0.7), lerp(rootY, endY, 0.76) + bend,
      endX, endY,
    );
    context.stroke();
  }

  context.strokeStyle = `rgba(94, 130, 255, ${0.38 * alpha})`;
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(rootX, rootY, min * 0.074, 0, TAU);
  context.stroke();

  if (pulsePhase !== null) {
    const angle = -0.42;
    const reach = min * 0.34;
    const pulseX = rootX + Math.cos(angle) * pulsePhase * reach;
    const pulseY = rootY + Math.sin(angle) * pulsePhase * reach * 0.9;
    context.fillStyle = `rgba(245, 218, 72, ${0.95 * alpha})`;
    context.beginPath();
    context.arc(pulseX, pulseY, 3.4, 0, TAU);
    context.fill();
  }
  context.restore();
}

function drawCollectiveStructure(context, phase, width, height) {
  if (phase === 1) return;
  const min = Math.min(width, height);
  const centreX = width * 0.66;
  const centreY = height * 0.51;

  context.save();
  context.globalCompositeOperation = 'source-over';
  context.lineCap = 'round';

  if (phase === 0) {
    context.strokeStyle = 'rgba(112, 231, 125, .13)';
    context.lineWidth = 1.1;
    collectiveDestinations.forEach(([endX, endY], route) => {
      const bend = (route % 2 ? 1 : -1) * min * (0.04 + route * 0.005);
      context.beginPath();
      context.moveTo(centreX, centreY);
      context.quadraticCurveTo(
        centreX + endX * min * 0.46 - endY * bend,
        centreY + endY * min * 0.46 + endX * bend,
        centreX + endX * min,
        centreY + endY * min,
      );
      context.stroke();
      context.beginPath();
      context.arc(centreX + endX * min, centreY + endY * min, 3.2, 0, TAU);
      context.stroke();
    });
    context.strokeStyle = 'rgba(245, 218, 72, .42)';
    context.beginPath();
    context.arc(centreX, centreY, min * 0.028, 0, TAU);
    context.stroke();
  } else {
    context.strokeStyle = 'rgba(112, 231, 125, .15)';
    context.lineWidth = 0.9;
    for (let branch = 0; branch < 16; branch += 1) {
      const angle = (branch / 16) * TAU - 0.42;
      const reach = min * (0.2 + (branch % 5) * 0.026);
      const junctionX = centreX + Math.cos(angle) * reach;
      const junctionY = centreY + Math.sin(angle) * reach * 0.78;
      context.beginPath();
      context.moveTo(centreX, centreY);
      context.lineTo(junctionX, junctionY);
      context.stroke();

      [-1, 1].forEach((direction) => {
        const childHash = hash(branch * 7.1 + direction * 3.7);
        const childAngle = angle + direction * (0.34 + childHash * 0.4);
        const childReach = min * (0.09 + childHash * 0.13);
        context.beginPath();
        context.moveTo(junctionX, junctionY);
        context.lineTo(
          junctionX + Math.cos(childAngle) * childReach,
          junctionY + Math.sin(childAngle) * childReach * 0.8,
        );
        context.stroke();
      });
    }
    context.fillStyle = 'rgba(245, 218, 72, .45)';
    context.beginPath();
    context.arc(centreX, centreY, 3.2, 0, TAU);
    context.fill();
  }

  context.restore();
}

export default function ParticleField({ scene, variant, collectivePhase, storyProgress }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(scene);
  const variantRef = useRef(variant);
  const collectivePhaseRef = useRef(collectivePhase);
  const storyProgressRef = useRef(storyProgress);

  useEffect(() => { sceneRef.current = scene; }, [scene]);
  useEffect(() => { variantRef.current = variant; }, [variant]);
  useEffect(() => { collectivePhaseRef.current = collectivePhase; }, [collectivePhase]);
  useEffect(() => { storyProgressRef.current = storyProgress; }, [storyProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: 0, y: 0, active: false, visible: false };
    let width = 0;
    let height = 0;
    let ratio = 1;
    let frame;
    let last = performance.now();
    let particles = [];
    let pulseStartedAt = -10;

    const build = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      ratio = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = reducedMotion ? 420 : width < 700 ? 580 : 920;
      particles = Array.from({ length: count }, (_, index) => {
        const target = shapePoint(
          sceneRef.current,
          variantRef.current,
          collectivePhaseRef.current,
          storyProgressRef.current,
          index,
          count,
          width,
          height,
          0,
        );
        return {
          x: target.x,
          y: target.y,
          vx: 0,
          vy: 0,
          size: index === 0 ? 3.8 : 0.55 + hash(index + 11) * 1.45,
        };
      });
    };

    const updatePointer = (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.visible = true;
    };
    const onPointerMove = (event) => updatePointer(event);
    const onPointerDown = (event) => {
      if (event.target instanceof Element && event.target.closest('button, a, input, select, textarea')) return;
      pointer.active = true;
      updatePointer(event);
      pulseStartedAt = performance.now() / 1000;
    };
    const onPointerUp = () => { pointer.active = false; };
    const onFieldAction = (event) => {
      pointer.active = Boolean(event.detail?.active);
      pointer.visible = true;
      pointer.x = width * 0.7;
      pointer.y = height * 0.51;
      if (pointer.active) pulseStartedAt = performance.now() / 1000;
    };

    const drawParticle = (target, size, alpha = 1) => {
      const rgb = palette[target.color] || palette.primary;
      context.beginPath();
      context.fillStyle = `rgba(${rgb}, ${target.alpha * alpha})`;
      context.arc(target.x, target.y, size, 0, TAU);
      context.fill();
    };

    const draw = (now) => {
      const delta = Math.min((now - last) / 16.667, 2.2);
      last = now;
      const time = now / 1000;
      const activeScene = sceneRef.current;
      const activeProgress = storyProgressRef.current;
      const weights = matterWeights(activeProgress);
      const manualPulseAge = time - pulseStartedAt;
      const pulsePhase = reducedMotion
        ? null
        : manualPulseAge < 1.7
          ? clamp(manualPulseAge / 1.25)
          : (time % 4.8) / 4.8;

      context.clearRect(0, 0, width, height);

      if (activeScene === 1) {
        drawSiliconStructure(context, width, height, weights.silicon, pulsePhase);
        drawNeuralStructure(context, width, height, weights.neural, pulsePhase);
      }
      if (activeScene === 3) {
        drawCollectiveStructure(context, collectivePhaseRef.current, width, height);
      }

      context.globalCompositeOperation = 'lighter';

      if (reducedMotion && activeScene === 1) {
        particles.forEach((particle, index) => {
          if (weights.sand > 0.01) drawParticle(sandPoint(index, particles.length, width, height, 0), particle.size, weights.sand);
          if (weights.silicon > 0.01) drawParticle(siliconPoint(index, particles.length, width, height), particle.size, weights.silicon);
          if (weights.neural > 0.01) drawParticle(neuralPoint(index, particles.length, width, height), particle.size, weights.neural);
        });
      } else if (reducedMotion) {
        particles.forEach((particle, index) => {
          const target = shapePoint(activeScene, variantRef.current, collectivePhaseRef.current, activeProgress, index, particles.length, width, height, 0);
          drawParticle(target, particle.size * (target.scale ?? 1));
        });
      } else {
        particles.forEach((particle, index) => {
          const target = shapePoint(activeScene, variantRef.current, collectivePhaseRef.current, activeProgress, index, particles.length, width, height, time);
          const dx = target.x - particle.x;
          const dy = target.y - particle.y;
          const orderedMatter = activeScene === 1 && activeProgress >= 0.34;
          const choreographedMorph = activeScene === 3 || activeScene === 5;
          const attraction = orderedMatter ? 0.014 : choreographedMorph ? 0.0115 : 0.0075;
          particle.vx += dx * attraction * delta;
          particle.vy += dy * attraction * delta;

          if (pointer.visible && !orderedMatter) {
            const px = pointer.x - particle.x;
            const py = pointer.y - particle.y;
            const distanceSq = px * px + py * py;
            const reach = pointer.active ? 62000 : 15000;
            if (distanceSq < reach && distanceSq > 25) {
              const compression = activeScene === 1 ? 0.09 : 0.055;
              const force = (1 - distanceSq / reach) * (pointer.active ? compression : -0.018);
              particle.vx += px * force * delta;
              particle.vy += py * force * delta;
            }
          }

          const drag = orderedMatter ? 0.82 : choreographedMorph ? 0.85 : 0.88;
          particle.vx *= drag;
          particle.vy *= drag;
          particle.x += particle.vx * delta;
          particle.y += particle.vy * delta;

          const pathDistance = Math.abs((target.path ?? 0) - pulsePhase);
          const pulseActive = orderedMatter && pathDistance < 0.045;
          const rgb = palette[pulseActive ? 'alien' : target.color] || palette.primary;
          const targetSize = particle.size * (target.scale ?? 1);
          context.beginPath();
          context.fillStyle = `rgba(${rgb}, ${pulseActive ? 1 : target.alpha})`;
          context.arc(particle.x, particle.y, pulseActive ? targetSize * 1.75 : targetSize, 0, TAU);
          context.fill();
        });
      }

      if (pointer.visible && activeScene !== 2) {
        context.globalCompositeOperation = 'source-over';
        context.beginPath();
        context.strokeStyle = pointer.active ? 'rgba(245, 218, 72, .72)' : 'rgba(255, 255, 255, .18)';
        context.lineWidth = 1;
        context.arc(pointer.x, pointer.y, pointer.active ? 42 : 18, 0, TAU);
        context.stroke();
      }

      frame = requestAnimationFrame(draw);
    };

    build();
    window.addEventListener('resize', build);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    window.addEventListener('forms:field-action', onFieldAction);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', build);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('forms:field-action', onFieldAction);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-field" aria-hidden="true" />;
}
