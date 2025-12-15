import { useSelector } from 'react-redux';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export const usePermission = (moduleKey: string, action: PermissionAction) => {
  
  const { userProfile } = useSelector((state: any) => state.auth);
  
  console.log('🔐 Permission Check:', {
    moduleKey,
    action,
    userProfile: userProfile ? {
      id: userProfile._id,
      role: userProfile.role,
      organisationId: userProfile.organisationId,
      permissions: userProfile.permissions
    } : null
  });
  
  if (!userProfile) {
    console.log('❌ No user profile found');
    return false;
  }

  if (userProfile.role === 'admin') {
    console.log('✅ Admin access granted');
    return true;
  }

  const userPerms = userProfile.permissions || {};
  const hasPermission = userPerms[moduleKey]?.[action] === true;
  
  console.log('🔍 Permission result:', {
    moduleKey,
    action,
    userPerms: userPerms[moduleKey],
    hasPermission
  });

  return hasPermission;
};