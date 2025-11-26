import { useSelector } from 'react-redux';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export const usePermission = (moduleKey: string, action: PermissionAction) => {
  
  const { userProfile } = useSelector((state: any) => state.auth);
  
  if (!userProfile) return false;

  if (userProfile.role === 'admin') return true;

  const userPerms = userProfile.permissions || {};

  return userPerms[moduleKey]?.[action] === true;
};