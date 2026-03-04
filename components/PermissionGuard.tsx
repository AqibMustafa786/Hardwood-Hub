"use client";
import React from "react";
import { usePermission } from "@/hooks/usePermission";

interface PermissionGuardProps {
    permission: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    mode?: "hide" | "disable";
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    permission,
    children,
    fallback = null,
    mode = "hide"
}) => {
    const { can, loading } = usePermission();

    if (loading) return null;

    const hasAccess = can(permission);

    if (!hasAccess) {
        if (mode === "disable") {
            return React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    const typedChild = child as React.ReactElement<any>;
                    return React.cloneElement(typedChild, {
                        disabled: true,
                        title: "You do not have permission to execute this action.",
                        className: `${typedChild.props.className || ""} opacity-50 cursor-not-allowed pointer-events-none`
                    });
                }
                return child;
            });
        }
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
