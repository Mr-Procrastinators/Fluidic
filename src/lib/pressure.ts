const WATER_DENSITY_KG_PER_M3 = 1000;
const PIPE_DIAMETER_METERS = 0.02;

export function calculateDynamicPressurePa(flowLitersPerMinute: number): number {
  const flowCubicMetersPerSecond = flowLitersPerMinute / 60000;
  const pipeAreaSquareMeters = Math.PI * (PIPE_DIAMETER_METERS / 2) ** 2;
  const velocityMetersPerSecond = flowCubicMetersPerSecond / pipeAreaSquareMeters;

  return 0.5 * WATER_DENSITY_KG_PER_M3 * velocityMetersPerSecond ** 2;
}
