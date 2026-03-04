"use client";
import { useAuth } from "@/context/AuthContext";

export const usePermission = () => {
    const { hasPermission, permissions, loading, role } = useAuth();

    return {
        can: (permission: string) => hasPermission(permission),
        permissions,
        loading,
        role,
        isSuperAdmin: role === 'superAdmin'
    };
};
