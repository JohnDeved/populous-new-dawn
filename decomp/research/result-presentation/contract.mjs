// Pure Western source contract. Not imported by runtime and not a native runner.
// Caller supplies native-equivalent counters and exact source glyph measurements.
export const sourceInputRate = 12;
export const sourceIntervalMs = rate => Math.trunc(1000 / rate);
export const resultInputEligible = simulationCounter => (simulationCounter >>> 0) > 10;
export function resultPhases(inputCycle) {
  const cycle = inputCycle >>> 0;
  return {
    overlay: Boolean(Math.trunc(cycle / 6) & 1),
    statisticsStatusValue: !(Math.trunc(cycle / 6) & 1),
    statisticsPrompt: Boolean(Math.trunc(cycle / 4) & 1),
  };
}
export function resultFontSlots(screenWidth, screenHeight) {
  return { overlay: 3, statistics: screenWidth * screenHeight < 640 * 480 ? 4 : 3 };
}
// One already-due ordinary SP scheduler cycle, not its timer/queue implementation.
export function admittedCycle({ inputCycle, simulationCounter, admitted,
  landPaused = false, popupOwnsSimulation = false, speedExtra = 0 }) {
  return {
    inputCycle: (inputCycle + Number(admitted)) >>> 0,
    simulationCounter: (simulationCounter +
      (admitted && !landPaused && !popupOwnsSimulation ? speedExtra + 1 : 0)) >>> 0,
  };
}
export function terminalOverlayGeometry(viewport, statusWidth, promptWidth, glyphHeight) {
  const y = viewport.y + Math.trunc(7 * (viewport.height - glyphHeight) / 8);
  return {
    status: { x: viewport.x + Math.trunc((viewport.width - statusWidth) / 2), y },
    prompt: { x: viewport.x + Math.trunc((viewport.width - promptWidth) / 2),
      y: y + glyphHeight },
  };
}
export function statisticsLayout(screenWidth, screenHeight, glyph, width, rows,
  tile = { width: 16, height: 16 }, reward = { width: 36, height: 43 }) {
  const font = resultFontSlots(screenWidth, screenHeight).statistics;
  const a = glyph('A', font), small = screenHeight <= 220;
  const lineHeight = small ? Math.trunc(14 * a.h / 16) + 1 : a.h - 1;
  const groupGap = small ? 3 : Math.trunc(5 * a.h / 16) + 2;
  const top = Math.trunc(tile.height / (small ? 4 : 2));
  const bottom = Math.trunc(a.w / 2) + (small ? 2 : 0);
  const maxLabelWidth = Math.max(...rows.map(row => width(row.label, font)));
  const colonWidth = width(':', font), timeReserveWidth = width(' 22:22:22 ', font);
  const contentWidth = Math.max(maxLabelWidth + colonWidth + timeReserveWidth,
    5 * reward.width + 4 * a.w) + 2 * tile.width;
  const contentHeight = (rows.length + 4) * lineHeight +
    rows.filter(row => row.groupBefore).length * groupGap +
    2 * (top + bottom) + Math.trunc(lineHeight / 2) + reward.height;
  const panelWidth = Math.ceil(contentWidth / tile.width) * tile.width;
  const panelHeight = Math.ceil(contentHeight / tile.height) * tile.height;
  const contentInset = [Math.trunc((panelWidth - contentWidth) / 2),
    Math.trunc((panelHeight - contentHeight) / 2)];
  const headingY = contentInset[1] + top, timeY = headingY + 3 * lineHeight + Math.trunc(lineHeight / 2);
  const labelX = contentInset[0] + tile.width, valueColonX = labelX + maxLabelWidth + colonWidth;
  let rowY = timeY + lineHeight;
  const rowYs = rows.map(row => {
    if (row.groupBefore) rowY += groupGap;
    const y = rowY; rowY += lineHeight; return y;
  });
  const counterSeparatorWidth = width(': ', font);
  return { font, panelWidth, panelHeight, contentWidth, contentHeight, contentInset,
    columns: panelWidth / tile.width, rows: panelHeight / tile.height,
    headingY, playerY: headingY + lineHeight, statusY: headingY + 2 * lineHeight,
    timeY, labelX, valueColonX, lineHeight, groupGap,
    promptY: panelHeight + Math.trunc(lineHeight / 4), maxLabelWidth, colonWidth,
    timeReserveWidth, counterSeparatorWidth, counterValueStartX: valueColonX + counterSeparatorWidth,
    counterReserveWidth: width(': 22:22:22', font), rowYs };
}
export function statisticsPlacement(viewport, screenHeight, layout, promptWidth) {
  const x = viewport.x + Math.trunc((viewport.width - layout.panelWidth) / 2);
  const y = viewport.y + Math.trunc((viewport.height - layout.panelHeight) / 2);
  const provisionalY = y + layout.panelHeight + Math.trunc(layout.lineHeight / 4);
  return { x, y, prompt: { x: x + Math.trunc((layout.panelWidth - promptWidth) / 2),
    y: provisionalY > screenHeight ? screenHeight - layout.lineHeight - 2 : provisionalY } };
}
export const headingOrigin = (layout, fullStringWidth) =>
  layout.contentInset[0] + Math.trunc((layout.contentWidth - fullStringWidth) / 2);
