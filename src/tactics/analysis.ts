import {
  computeBestPass,
  computeOffside,
  computeTeamControl,
  computeVoronoiZones,
  type BestPass,
  type OffsideInfo,
  type Player,
  type TeamControl,
} from "./engine";

export interface TacticalAnalysis {
  control: TeamControl;
  bestPass: BestPass | null;
  offside: OffsideInfo | null;
}

/** Resumo tatico usado pelo placar do AR e pelo simulador. */
export function analyzeTactic(
  players: Player[],
  carrierId: string | null,
  showOffside = true
): TacticalAnalysis {
  const control =
    players.length > 0
      ? computeTeamControl(computeVoronoiZones(players))
      : { A: 0.5, B: 0.5 };
  return {
    control,
    bestPass: computeBestPass(players, carrierId, { offside: showOffside }),
    offside: computeOffside(players, carrierId),
  };
}
