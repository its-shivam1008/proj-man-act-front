import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import {
  BarChart3,
  CheckSquare,
  Target,
  Bell,
  Users,
  Tag,
  Settings
} from 'lucide-react';
import { storage, STORAGE_KEYS } from '@/lib/storage';

// Import Quality Control Components
import Overview from '../../components/qualitycontrol/Overview';
import QualityChecks from '../../components/qualitycontrol/QualityChecks';
import ControlPoints from '../../components/qualitycontrol/ControlPoints';
import QualityAlerts from '../../components/qualitycontrol/QualityAlerts';
import QualityTeams from '../../components/qualitycontrol/QualityTeams';
import QualityTags from '../../components/qualitycontrol/QualityTags';
import Reports from '../../components/qualitycontrol/Reports';
import QualitySettings from '../../components/qualitycontrol/Settings';

const Quality: React.FC = () => {
  const { inventory } = useData();

  // Local state for quality data (only for components that still use localStorage)
  const [qualityChecks, setQualityChecks] = useState<any[]>([]);
  const [qualityControlPoints, setQualityControlPoints] = useState<any[]>([]);
  const [qualityAlerts, setQualityAlerts] = useState<any[]>([]);
  const [qualityTeams, setQualityTeams] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Load data from localStorage on mount (only for components that still use localStorage)
  useEffect(() => {
    setQualityChecks(storage.get(STORAGE_KEYS.QUALITY_CHECKS, []) || []);
    setQualityControlPoints(storage.get(STORAGE_KEYS.QUALITY_CONTROL_POINTS, []) || []);
    setQualityAlerts(storage.get(STORAGE_KEYS.QUALITY_ALERTS, []) || []);
    setQualityTeams(storage.get(STORAGE_KEYS.QUALITY_TEAMS, []) || []);
  }, []);

  // CRUD functions for Quality Checks (still using localStorage)
  const addQualityCheck = (newCheck: any) => {
    const updated = [...qualityChecks, newCheck];
    storage.set(STORAGE_KEYS.QUALITY_CHECKS, updated);
    setQualityChecks(updated);
  };

  const updateQualityCheck = (updatedCheck: any) => {
    const updated = qualityChecks.map((c) => (c.id === updatedCheck.id ? updatedCheck : c));
    storage.set(STORAGE_KEYS.QUALITY_CHECKS, updated);
    setQualityChecks(updated);
  };

  const deleteQualityCheck = (id: string) => {
    const updated = qualityChecks.filter((c) => c.id !== id);
    storage.set(STORAGE_KEYS.QUALITY_CHECKS, updated);
    setQualityChecks(updated);
  };

  // CRUD functions for Quality Control Points (still using localStorage)
  const addQualityControlPoint = (newCP: any) => {
    const updated = [...qualityControlPoints, newCP];
    storage.set(STORAGE_KEYS.QUALITY_CONTROL_POINTS, updated);
    setQualityControlPoints(updated);
  };

  const updateQualityControlPoint = (updatedCP: any) => {
    const updated = qualityControlPoints.map((cp) => (cp.id === updatedCP.id ? updatedCP : cp));
    storage.set(STORAGE_KEYS.QUALITY_CONTROL_POINTS, updated);
    setQualityControlPoints(updated);
  };

  const deleteQualityControlPoint = (id: string) => {
    const updated = qualityControlPoints.filter((cp) => cp.id !== id);
    storage.set(STORAGE_KEYS.QUALITY_CONTROL_POINTS, updated);
    setQualityControlPoints(updated);
  };

  // CRUD functions for Quality Teams (still using localStorage)
  const addQualityTeam = (newTeam: any) => {
    const updated = [...qualityTeams, newTeam];
    storage.set(STORAGE_KEYS.QUALITY_TEAMS, updated);
    setQualityTeams(updated);
  };

  const updateQualityTeam = (updatedTeam: any) => {
    const updated = qualityTeams.map((t) => (t.id === updatedTeam.id ? updatedTeam : t));
    storage.set(STORAGE_KEYS.QUALITY_TEAMS, updated);
    setQualityTeams(updated);
  };

  const deleteQualityTeam = (id: string) => {
    const updated = qualityTeams.filter((t) => t.id !== id);
    storage.set(STORAGE_KEYS.QUALITY_TEAMS, updated);
    setQualityTeams(updated);
  };

  const handleSaveSettings = (settings: any) => {
    // Save settings to localStorage or send to backend
    storage.set('QUALITY_SETTINGS', settings);
    console.log('Settings saved:', settings);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'checks', name: 'Quality Checks', icon: CheckSquare },
    { id: 'control-points', name: 'Control Points', icon: Target },
    { id: 'alerts', name: 'Quality Alerts', icon: Bell },
    { id: 'teams', name: 'Quality Teams', icon: Users },
    { id: 'tags', name: 'Quality Tags', icon: Tag },
    { id: 'reports', name: 'Reports & Analytics', icon: BarChart3 },
    // { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Overview />
        );
      case 'checks':
        return (
          <QualityChecks />
        );
      case 'control-points':
        return (
          <ControlPoints />
        );
      case 'alerts':
        return (
          <QualityAlerts />
        );
      case 'teams':
        return (
          <QualityTeams />
        );
      case 'tags':
        return (
          <QualityTags />
        );
      case 'reports':
        return (
          <Reports />
        );
      // case 'settings':
      //   return (
      //     <QualitySettings
      //       onSave={handleSaveSettings}
      //     />
      //   );
      default:
        return (
          <Overview />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quality Management System</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive quality control with checks, alerts, and compliance reporting
          </p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon
                  className={`mr-2 h-5 w-5 transition-colors ${
                    activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default Quality;