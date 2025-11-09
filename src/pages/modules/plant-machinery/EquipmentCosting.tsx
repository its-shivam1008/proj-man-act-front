import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { getFromStorage, PM_STORAGE_KEYS } from '../../../utils/plantMachineryStorage';
import type { Equipment, EquipmentAllocation, PreventiveMaintenance, BreakdownMaintenance, FuelLubricant } from '../../../types/plantMachinery';

const EquipmentCostingPage: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [costData, setCostData] = useState<any>(null);

  useEffect(() => {
    setEquipment(getFromStorage<Equipment>(PM_STORAGE_KEYS.EQUIPMENT));
  }, []);

  useEffect(() => {
    if (selectedEquipment) {
      calculateCosts(selectedEquipment);
    }
  }, [selectedEquipment]);

  const calculateCosts = (equipmentId: string) => {
    const eq = equipment.find(e => e.id === equipmentId);
    if (!eq) return;

    const allocations = getFromStorage<EquipmentAllocation>(PM_STORAGE_KEYS.ALLOCATIONS).filter(a => a.equipmentId === equipmentId);
    const pmRecords = getFromStorage<PreventiveMaintenance>(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE).filter(p => p.equipmentId === equipmentId);
    const breakdowns = getFromStorage<BreakdownMaintenance>(PM_STORAGE_KEYS.BREAKDOWN_MAINTENANCE).filter(b => b.equipmentId === equipmentId);
    const fuelRecords = getFromStorage<FuelLubricant>(PM_STORAGE_KEYS.FUEL_LUBRICANT).filter(f => f.equipmentId === equipmentId);

    const totalWorkingHours = allocations.reduce((sum, a) => sum + a.workingHours, 0);
    const totalFuelCost = fuelRecords.reduce((sum, f) => sum + f.fuelCost, 0);
    const totalPMCost = pmRecords.reduce((sum, p) => sum + p.totalCost, 0);
    const totalBreakdownCost = breakdowns.reduce((sum, b) => sum + b.totalCost, 0);
    const totalMaintenanceCost = totalPMCost + totalBreakdownCost;
    const totalCost = totalFuelCost + totalMaintenanceCost;
    const costPerHour = totalWorkingHours > 0 ? totalCost / totalWorkingHours : 0;

    // Calculate depreciation
    const purchaseDate = new Date(eq.purchaseDate);
    const today = new Date();
    const yearsUsed = (today.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24 * 365);
    const depreciationAmount = eq.depreciationMethod === 'straight-line' 
      ? (eq.purchaseCost * eq.depreciationRate / 100) * yearsUsed
      : eq.purchaseCost - eq.currentValue;

    setCostData({
      equipment: eq,
      workingHours: totalWorkingHours,
      fuelCost: totalFuelCost,
      maintenanceCost: totalMaintenanceCost,
      pmCost: totalPMCost,
      breakdownCost: totalBreakdownCost,
      totalCost,
      costPerHour,
      depreciationAmount,
      currentValue: eq.purchaseCost - depreciationAmount,
      breakdownCount: breakdowns.length,
      pmCount: pmRecords.length,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Equipment Costing</h1>
        <p className="text-muted-foreground">Track costs and depreciation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
            <SelectTrigger>
              <SelectValue placeholder="Select equipment to view costs" />
            </SelectTrigger>
            <SelectContent>
              {equipment.map(eq => (
                <SelectItem key={eq.id} value={eq.id}>
                  {eq.equipmentCode} - {eq.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {costData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Operating Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{costData.totalCost.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">All expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cost Per Hour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{costData.costPerHour.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">{costData.workingHours}h total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fuel Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">₹{costData.fuelCost.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Fuel & lubricants</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">₹{costData.maintenanceCost.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">PM + Breakdown</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Fuel & Lubricants</span>
                  <span className="font-semibold">₹{costData.fuelCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Preventive Maintenance</span>
                  <span className="font-semibold">₹{costData.pmCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Breakdown Repairs</span>
                  <span className="font-semibold text-destructive">₹{costData.breakdownCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">₹{costData.totalCost.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asset Valuation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Purchase Cost</span>
                  <span className="font-semibold">₹{costData.equipment.purchaseCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Depreciation Amount</span>
                  <span className="font-semibold text-destructive">-₹{costData.depreciationAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Depreciation Method</span>
                  <span className="font-semibold capitalize">{costData.equipment.depreciationMethod.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2">
                  <span className="font-semibold">Current Book Value</span>
                  <span className="font-bold text-lg text-success">₹{costData.currentValue.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{costData.pmCount}</div>
                  <p className="text-sm text-muted-foreground mt-1">Preventive Maintenance</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-destructive">{costData.breakdownCount}</div>
                  <p className="text-sm text-muted-foreground mt-1">Breakdowns</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">{costData.workingHours}h</div>
                  <p className="text-sm text-muted-foreground mt-1">Working Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default EquipmentCostingPage;
