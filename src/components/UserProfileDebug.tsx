import React from 'react';
import { useSelector } from 'react-redux';

const UserProfileDebug: React.FC = () => {
  const { userProfile } = useSelector((state: any) => state.auth);

  if (!userProfile) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 rounded-lg p-4 max-w-md">
        <h3 className="font-bold text-red-800">User Profile Debug</h3>
        <p className="text-red-600">No user profile found</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-300 rounded-lg p-4 max-w-md text-xs">
      <h3 className="font-bold text-blue-800 mb-2">User Profile Debug</h3>
      <div className="space-y-1 text-blue-700">
        <div><strong>ID:</strong> {userProfile._id}</div>
        <div><strong>Email:</strong> {userProfile.email}</div>
        <div><strong>Role:</strong> {userProfile.role}</div>
        <div><strong>Org ID:</strong> {userProfile.organisationId}</div>
        <div><strong>Location:</strong> {JSON.stringify(userProfile.location)}</div>
        <div><strong>Location Details:</strong> {JSON.stringify(userProfile.locationDetails)}</div>
        <div><strong>Location Type:</strong> {typeof userProfile.location}</div>
      </div>
    </div>
  );
};

export default UserProfileDebug;