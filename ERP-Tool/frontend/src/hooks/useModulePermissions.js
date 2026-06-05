import { useERPStore } from '../store/useERPStore';

/**
 * Hook to check module permissions for RBAC
 * @param {string} moduleKey - The backend module key (e.g., 'finance', 'human_resources')
 * @returns {Object} Permission object with canRead, canWrite, canExport flags
 */
export function useModulePermissions(moduleKey) {
  const { currentUser, userPermissions, demoMode } = useERPStore();

  // CEO has full access to everything
  if (currentUser?.isCEO || demoMode) {
    return {
      canRead: true,
      canWrite: true,
      canExport: true,
      isReadOnly: false
    };
  }

  // Get permissions for the specific module
  const permission = userPermissions?.find(p => p.moduleKey === moduleKey);

  // Default to no access if permission not found
  if (!permission) {
    return {
      canRead: false,
      canWrite: false,
      canExport: false,
      isReadOnly: false
    };
  }

  return {
    canRead: permission.canRead,
    canWrite: permission.canWrite,
    canExport: permission.canExport,
    isReadOnly: !permission.canWrite
  };
}

/**
 * Hook to check if current user can perform write operations on a module
 * @param {string} moduleKey - The backend module key
 * @returns {boolean} True if user can write, false otherwise
 */
export function useCanWrite(moduleKey) {
  const { canWrite } = useModulePermissions(moduleKey);
  return canWrite;
}

/**
 * Hook to check if current user can export from a module
 * @param {string} moduleKey - The backend module key
 * @returns {boolean} True if user can export, false otherwise
 */
export function useCanExport(moduleKey) {
  const { canExport } = useModulePermissions(moduleKey);
  return canExport;
}

/**
 * Hook to check if current user has read access to a module
 * @param {string} moduleKey - The backend module key
 * @returns {boolean} True if user can read, false otherwise
 */
export function useCanRead(moduleKey) {
  const { canRead } = useModulePermissions(moduleKey);
  return canRead;
}
