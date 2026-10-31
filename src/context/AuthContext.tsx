import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  UserRole, 
  FeaturePermissionKey, 
  DEFAULT_ROLE_PERMISSIONS, 
  ROLE_INFO,
  MOCK_USERS 
} from '../types/auth';

const CURRENT_USER_KEY = 'VALU_MANAGER_CURRENT_USER';
const ALL_USERS_KEY = 'VALU_MANAGER_ALL_USERS';

interface RegisterData {
  name: string;
  username: string;
  email: string;
  phone?: string;
  department: string;
  role: UserRole;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (usernameOrEmail: string, password?: string) => { success: boolean; error?: string };
  register: (data: RegisterData) => { success: boolean; error?: string };
  loginAsDemo: (demoUser: User) => void;
  logout: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isPermissionModalOpen: boolean;
  setIsPermissionModalOpen: (open: boolean) => void;
  hasPermission: (feature: FeaturePermissionKey) => boolean;
  updateUserPermissions: (userId: string, permissions: FeaturePermissionKey[]) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  resetUserPermissions: (userId: string) => void;
  addUser: (userData: Partial<User>) => { success: boolean; error?: string };
  deleteUser: (userId: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to ensure user has permissions array
const normalizeUserWithPermissions = (u: User): User => {
  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[u.role] || [];
  return {
    ...u,
    permissions: Array.isArray(u.permissions) ? u.permissions : defaultPerms
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Store all registered users + mock users
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(ALL_USERS_KEY);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeUserWithPermissions);
        }
      }
    } catch (e) {
      console.error('Failed to parse all users:', e);
    }
    return MOCK_USERS.map(normalizeUserWithPermissions);
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      if (saved) {
        if (saved === 'LOGGED_OUT') {
          return null;
        }
        const parsed = JSON.parse(saved);
        return normalizeUserWithPermissions(parsed);
      }
    } catch (e) {
      console.error('Failed to parse saved current user:', e);
    }
    // Default logged in user on first launch: Admin (Trần Thị Thu)
    return normalizeUserWithPermissions(MOCK_USERS[0]);
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.setItem(CURRENT_USER_KEY, 'LOGGED_OUT');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(allUsers));
  }, [allUsers]);

  // Check if current user has permission
  const hasPermission = (feature: FeaturePermissionKey): boolean => {
    if (!user) return false;
    // Admin always has all permissions
    if (user.role === 'ADMIN') return true;
    const userPerms = user.permissions || DEFAULT_ROLE_PERMISSIONS[user.role] || [];
    return userPerms.includes(feature);
  };

  const isAdmin = user?.role === 'ADMIN';

  const login = (usernameOrEmail: string, _password?: string) => {
    const clean = usernameOrEmail.trim().toLowerCase();
    const found = allUsers.find(
      u => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    );

    if (found) {
      const normalized = normalizeUserWithPermissions(found);
      setUser(normalized);
      setIsLoginModalOpen(false);
      return { success: true };
    }

    // If not found in user list, create dynamic session
    const role: UserRole = 'APPRAISER';
    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: clean.split('@')[0] || 'user',
      name: usernameOrEmail.includes('@') ? usernameOrEmail.split('@')[0] : usernameOrEmail,
      email: usernameOrEmail.includes('@') ? usernameOrEmail : `${clean}@valumanager.vn`,
      role,
      roleName: ROLE_INFO[role]?.label || 'Chuyên viên Thẩm định',
      department: 'Phòng Thẩm định',
      phone: '0900 000 000',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
      permissions: [...DEFAULT_ROLE_PERMISSIONS[role]]
    };

    setAllUsers(prev => [newUser, ...prev]);
    setUser(newUser);
    setIsLoginModalOpen(false);
    return { success: true };
  };

  const register = (data: RegisterData) => {
    const cleanUsername = data.username.trim().toLowerCase();
    const cleanEmail = data.email.trim().toLowerCase();

    // Check existing
    const existing = allUsers.find(
      u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
    );

    if (existing) {
      return {
        success: false,
        error: 'Tên đăng nhập hoặc Email này đã tồn tại trong hệ thống.'
      };
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      name: data.name.trim(),
      email: cleanEmail,
      phone: data.phone?.trim() || '0900 000 000',
      department: data.department || 'Phòng Thẩm định 1',
      role: data.role,
      roleName: ROLE_INFO[data.role]?.label || 'Chuyên viên Thẩm định',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
      permissions: [...(DEFAULT_ROLE_PERMISSIONS[data.role] || [])]
    };

    setAllUsers(prev => [newUser, ...prev]);
    setUser(newUser);
    setIsLoginModalOpen(false);
    return { success: true };
  };

  const loginAsDemo = (demoUser: User) => {
    const normalized = normalizeUserWithPermissions(demoUser);
    setUser(normalized);
    setIsLoginModalOpen(false);
  };

  const logout = () => {
    setUser(null);
  };

  // Update granular permissions for a user
  const updateUserPermissions = (userId: string, permissions: FeaturePermissionKey[]) => {
    setAllUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          return { ...u, permissions };
        }
        return u;
      })
    );

    // If current logged-in user is updated, update active state too
    if (user && user.id === userId) {
      setUser(prev => (prev ? { ...prev, permissions } : null));
    }
  };

  // Update user role and refresh permissions to role defaults
  const updateUserRole = (userId: string, newRole: UserRole) => {
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[newRole] || [];
    const roleName = ROLE_INFO[newRole]?.label || newRole;

    setAllUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            role: newRole,
            roleName,
            permissions: defaultPerms
          };
        }
        return u;
      })
    );

    if (user && user.id === userId) {
      setUser(prev =>
        prev
          ? {
              ...prev,
              role: newRole,
              roleName,
              permissions: defaultPerms
            }
          : null
      );
    }
  };

  // Reset user's permissions to default role template
  const resetUserPermissions = (userId: string) => {
    const targetUser = allUsers.find(u => u.id === userId);
    if (!targetUser) return;
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[targetUser.role] || [];
    updateUserPermissions(userId, defaultPerms);
  };

  // Add new user from admin panel
  const addUser = (userData: Partial<User>) => {
    if (!userData.username || !userData.name || !userData.email) {
      return { success: false, error: 'Vui lòng điền đủ Tên, Tên đăng nhập và Email' };
    }

    const cleanUsername = userData.username.trim().toLowerCase();
    const cleanEmail = userData.email.trim().toLowerCase();

    const exists = allUsers.some(
      u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
    );
    if (exists) {
      return { success: false, error: 'Tên đăng nhập hoặc Email đã tồn tại' };
    }

    const role: UserRole = userData.role || 'APPRAISER';
    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      name: userData.name.trim(),
      email: cleanEmail,
      phone: userData.phone?.trim() || '0900 000 000',
      department: userData.department || 'Phòng Thẩm định 1',
      role,
      roleName: ROLE_INFO[role]?.label || 'Chuyên viên Thẩm định',
      avatarUrl: userData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      permissions: userData.permissions || [...DEFAULT_ROLE_PERMISSIONS[role]]
    };

    setAllUsers(prev => [newUser, ...prev]);
    return { success: true };
  };

  // Delete user from admin panel
  const deleteUser = (userId: string) => {
    if (user && user.id === userId) {
      return { success: false, error: 'Không thể xóa tài khoản bạn đang đăng nhập!' };
    }
    setAllUsers(prev => prev.filter(u => u.id !== userId));
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        allUsers,
        isLoggedIn: !!user,
        isAdmin,
        login,
        register,
        loginAsDemo,
        logout,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isPermissionModalOpen,
        setIsPermissionModalOpen,
        hasPermission,
        updateUserPermissions,
        updateUserRole,
        resetUserPermissions,
        addUser,
        deleteUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
