import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { migrateMaterialRequestsFromLocalStorage } from '@/redux/slices/materialRequestSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const MaterialRequestMigration: React.FC = () => {
  const dispatch = useDispatch();
  const [migrating, setMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const checkLocalStorageData = () => {
    const localData = localStorage.getItem('MATERIAL_REQUESTS');
    if (!localData) return null;
    
    try {
      const parsed = JSON.parse(localData);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const localStorageData = checkLocalStorageData();

  const handleMigration = async () => {
    if (!localStorageData || localStorageData.length === 0) {
      toast.error('No material requests found in localStorage');
      return;
    }

    setMigrating(true);
    setMigrationStatus('idle');

    try {
      await dispatch(migrateMaterialRequestsFromLocalStorage()).unwrap();
      setMigrationStatus('success');
      toast.success(`Successfully migrated ${localStorageData.length} material requests to database`);
    } catch (error) {
      setMigrationStatus('error');
      toast.error('Failed to migrate material requests');
      console.error('Migration error:', error);
    } finally {
      setMigrating(false);
    }
  };

  if (!localStorageData || localStorageData.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Material Request Migration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">No migration needed. All data is in database.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Material Request Migration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-orange-600">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm">
            Found {localStorageData.length} material requests in localStorage
          </span>
        </div>
        
        <p className="text-sm text-gray-600">
          Click below to migrate your material requests from localStorage to the database for better performance and reliability.
        </p>

        <Button 
          onClick={handleMigration}
          disabled={migrating}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {migrating ? 'Migrating...' : 'Migrate to Database'}
        </Button>

        {migrationStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            Migration completed successfully!
          </div>
        )}

        {migrationStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle className="h-4 w-4" />
            Migration failed. Please try again.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialRequestMigration;