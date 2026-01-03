import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Bell, Shield, Users, Database } from 'lucide-react';

interface SettingsProps {
  onSave: (settings: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ onSave }) => {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      autoGenerateCheckIds: true,
      defaultCheckResult: 'pending',
      requirePhotosForFailures: true,
      enableBatchTracking: true,
    },
    notifications: {
      emailAlerts: true,
      urgentAlertNotifications: true,
      dailyReports: false,
      weeklyReports: true,
      alertAssignmentNotifications: true,
    },
    quality: {
      defaultTolerancePercentage: 5,
      requireApprovalForChanges: true,
      enableControlPointValidation: true,
      mandatoryFields: ['product', 'operation', 'result'],
    },
    teams: {
      allowCrossTeamAssignment: true,
      requireTeamLeaderApproval: false,
      enableTeamPerformanceTracking: true,
      maxTeamSize: 10,
    },
    data: {
      dataRetentionPeriod: 365,
      enableDataExport: true,
      requireDataBackup: true,
      autoArchiveOldRecords: true,
    }
  });

  const settingSections = [
    {
      id: 'general',
      name: 'General Settings',
      icon: SettingsIcon,
      description: 'Basic system configuration'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      description: 'Alert and notification preferences'
    },
    {
      id: 'quality',
      name: 'Quality Parameters',
      icon: Shield,
      description: 'Quality control standards and rules'
    },
    {
      id: 'teams',
      name: 'Team Management',
      icon: Users,
      description: 'Team configuration and permissions'
    },
    {
      id: 'data',
      name: 'Data Management',
      icon: Database,
      description: 'Data retention and backup settings'
    }
  ];

  const handleSettingChange = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    onSave(settings);
    alert('Settings saved successfully!');
  };

  const GeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">General Configuration</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto-generate Check IDs</label>
              <p className="text-sm text-gray-500">Automatically create unique IDs for quality checks</p>
            </div>
            <input
              type="checkbox"
              checked={settings.general.autoGenerateCheckIds}
              onChange={(e) => handleSettingChange('general', 'autoGenerateCheckIds', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Default Check Result</label>
              <p className="text-sm text-gray-500">Default result status for new quality checks</p>
            </div>
            <select
              value={settings.general.defaultCheckResult}
              onChange={(e) => handleSettingChange('general', 'defaultCheckResult', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Require Photos for Failures</label>
              <p className="text-sm text-gray-500">Mandate photo uploads when checks fail</p>
            </div>
            <input
              type="checkbox"
              checked={settings.general.requirePhotosForFailures}
              onChange={(e) => handleSettingChange('general', 'requirePhotosForFailures', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Batch Tracking</label>
              <p className="text-sm text-gray-500">Track products by batch numbers</p>
            </div>
            <input
              type="checkbox"
              checked={settings.general.enableBatchTracking}
              onChange={(e) => handleSettingChange('general', 'enableBatchTracking', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const NotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Email Alerts</label>
              <p className="text-sm text-gray-500">Send email notifications for quality alerts</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.emailAlerts}
              onChange={(e) => handleSettingChange('notifications', 'emailAlerts', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Urgent Alert Notifications</label>
              <p className="text-sm text-gray-500">Immediate notifications for urgent alerts</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.urgentAlertNotifications}
              onChange={(e) => handleSettingChange('notifications', 'urgentAlertNotifications', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Daily Reports</label>
              <p className="text-sm text-gray-500">Receive daily quality summary reports</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.dailyReports}
              onChange={(e) => handleSettingChange('notifications', 'dailyReports', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Weekly Reports</label>
              <p className="text-sm text-gray-500">Receive weekly quality analysis reports</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.weeklyReports}
              onChange={(e) => handleSettingChange('notifications', 'weeklyReports', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Alert Assignment Notifications</label>
              <p className="text-sm text-gray-500">Notify when alerts are assigned to team members</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.alertAssignmentNotifications}
              onChange={(e) => handleSettingChange('notifications', 'alertAssignmentNotifications', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const QualitySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Parameters</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Default Tolerance Percentage</label>
              <p className="text-sm text-gray-500">Default tolerance for measurement checks</p>
            </div>
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                max="100"
                value={settings.quality.defaultTolerancePercentage}
                onChange={(e) => handleSettingChange('quality', 'defaultTolerancePercentage', Number(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-500">%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Require Approval for Changes</label>
              <p className="text-sm text-gray-500">Require supervisor approval for control point changes</p>
            </div>
            <input
              type="checkbox"
              checked={settings.quality.requireApprovalForChanges}
              onChange={(e) => handleSettingChange('quality', 'requireApprovalForChanges', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Control Point Validation</label>
              <p className="text-sm text-gray-500">Validate control points before activation</p>
            </div>
            <input
              type="checkbox"
              checked={settings.quality.enableControlPointValidation}
              onChange={(e) => handleSettingChange('quality', 'enableControlPointValidation', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const TeamSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Team Management</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Allow Cross-Team Assignment</label>
              <p className="text-sm text-gray-500">Allow assigning alerts to members from different teams</p>
            </div>
            <input
              type="checkbox"
              checked={settings.teams.allowCrossTeamAssignment}
              onChange={(e) => handleSettingChange('teams', 'allowCrossTeamAssignment', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Require Team Leader Approval</label>
              <p className="text-sm text-gray-500">Team leader must approve quality check results</p>
            </div>
            <input
              type="checkbox"
              checked={settings.teams.requireTeamLeaderApproval}
              onChange={(e) => handleSettingChange('teams', 'requireTeamLeaderApproval', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Performance Tracking</label>
              <p className="text-sm text-gray-500">Track individual and team performance metrics</p>
            </div>
            <input
              type="checkbox"
              checked={settings.teams.enableTeamPerformanceTracking}
              onChange={(e) => handleSettingChange('teams', 'enableTeamPerformanceTracking', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Maximum Team Size</label>
              <p className="text-sm text-gray-500">Maximum number of members per team</p>
            </div>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.teams.maxTeamSize}
              onChange={(e) => handleSettingChange('teams', 'maxTeamSize', Number(e.target.value))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const DataSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Data Retention Period</label>
              <p className="text-sm text-gray-500">How long to keep quality records (days)</p>
            </div>
            <div className="flex items-center">
              <input
                type="number"
                min="30"
                max="3650"
                value={settings.data.dataRetentionPeriod}
                onChange={(e) => handleSettingChange('data', 'dataRetentionPeriod', Number(e.target.value))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-500">days</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Data Export</label>
              <p className="text-sm text-gray-500">Allow users to export quality data</p>
            </div>
            <input
              type="checkbox"
              checked={settings.data.enableDataExport}
              onChange={(e) => handleSettingChange('data', 'enableDataExport', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Require Data Backup</label>
              <p className="text-sm text-gray-500">Mandatory regular data backups</p>
            </div>
            <input
              type="checkbox"
              checked={settings.data.requireDataBackup}
              onChange={(e) => handleSettingChange('data', 'requireDataBackup', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto-Archive Old Records</label>
              <p className="text-sm text-gray-500">Automatically archive records after retention period</p>
            </div>
            <input
              type="checkbox"
              checked={settings.data.autoArchiveOldRecords}
              onChange={(e) => handleSettingChange('data', 'autoArchiveOldRecords', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingContent = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'quality':
        return <QualitySettings />;
      case 'teams':
        return <TeamSettings />;
      case 'data':
        return <DataSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Categories */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Quality Control Settings</h3>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {settingSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`p-4 text-left border rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <Icon className={`h-5 w-5 mr-2 ${
                      activeSection === section.id ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <h4 className={`font-medium text-sm ${
                      activeSection === section.id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {section.name}
                    </h4>
                  </div>
                  <p className={`text-xs ${
                    activeSection === section.id ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {section.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {renderSettingContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;