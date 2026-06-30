import { useERPStore } from '../store/useERPStore';

export function useAuth() {
  const token = useERPStore((s) => s.token);
  const currentUser = useERPStore((s) => s.currentUser);
  const userPermissions = useERPStore((s) => s.userPermissions);
  const allowedModules = useERPStore((s) => s.allowedModules);
  const logout = useERPStore((s) => s.logout);
  const setToken = useERPStore((s) => s.setToken);
  const setCurrentUser = useERPStore((s) => s.setCurrentUser);

  const hasPermission = (perm) => {
    if (currentUser?.isCEO) return true;
    return userPermissions.includes(perm);
  };

  return { token, currentUser, userPermissions, allowedModules, logout, setToken, setCurrentUser, hasPermission };
}
