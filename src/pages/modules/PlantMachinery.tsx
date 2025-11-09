import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, TrendingUp, Factory } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const PlantMachinery = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Factory className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Plant & Machinery ERP
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete equipment lifecycle management system for manufacturing and industrial operations
          </p>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Equipment Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track all machinery assets, maintenance schedules, and operational status in real-time
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Monitor utilization rates, downtime, and maintenance costs with comprehensive KPIs
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Factory className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Maintenance Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Schedule preventive maintenance and handle breakdowns efficiently to maximize uptime
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/plant-machinery">
            <Button size="lg" className="text-lg px-8 py-6">
              <Factory className="mr-2 h-5 w-5" />
              Launch Plant & Machinery Dashboard
            </Button>
          </Link>
        </div>

        {/* Features List */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Complete Feature Set</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-semibold">Equipment Asset Management</p>
                  <p className="text-sm text-muted-foreground">Digital register with complete lifecycle tracking</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-semibold">Preventive Maintenance</p>
                  <p className="text-sm text-muted-foreground">Automated scheduling and work order generation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-semibold">Breakdown Management</p>
                  <p className="text-sm text-muted-foreground">Track failures, repairs, and root cause analysis</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-semibold">Spare Parts Inventory</p>
                  <p className="text-sm text-muted-foreground">Stock management with reorder alerts</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-semibold">Fuel & Lubricant Tracking</p>
                  <p className="text-sm text-muted-foreground">Consumption monitoring and efficiency analysis</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-semibold">Calibration & Safety</p>
                  <p className="text-sm text-muted-foreground">Certificate management and compliance tracking</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-semibold">Equipment Costing</p>
                  <p className="text-sm text-muted-foreground">Depreciation, cost-per-hour, and ROI analysis</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-semibold">Reports & Analytics</p>
                  <p className="text-sm text-muted-foreground">Comprehensive KPIs and performance metrics</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlantMachinery;
