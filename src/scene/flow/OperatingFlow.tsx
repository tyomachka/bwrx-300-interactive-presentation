/**
 * Stage 7 normal operating flow: the vessel's natural circulation and the steam / power path to
 * the grid. Mounted beside the plant, not inside it, so Explore picking and highlighting never
 * see the flow. What it shows comes from one place, animation/operatingFlow.ts: the master
 * sequence while it plays, Explore Flow when it is on, otherwise nothing (and no draw calls).
 */
import { PowerFlow } from './PowerFlow';
import { VesselFlow } from './VesselFlow';

export function OperatingFlow() {
  return (
    <group name="operating-flow">
      <VesselFlow />
      <PowerFlow />
    </group>
  );
}
