export type ManufRepairType = 'Manufacture' | 'Repair' | 'Hydra';
export type HydraStatusType = 'No' | 'Yes';

export interface ParsedPlanDraft {
  id: string;
  date: string;
  plant: string;
  mold: string;
  insert: string;
  neededQty: string;
  hydraStatus: HydraStatusType;
  manufRepair: ManufRepairType;
  deadline: string;
  status2: string;
}

export interface PlanRow extends ParsedPlanDraft {
  createdAt: number;
}
