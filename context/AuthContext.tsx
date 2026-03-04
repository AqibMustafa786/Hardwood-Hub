"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
    user: User | null;
    profile: any | null;
    loading: boolean;
    role: string | null;
    permissions: any | null;
    hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    role: null,
    permissions: null,
    hasPermission: () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);

    const checkPermission = (userPerms: string[], requiredPerm: string) => {
        if (userPerms.includes('*.*.*') || userPerms.includes('*')) return true;

        return userPerms.some(p => {
            if (p === requiredPerm) return true;

            const pParts = p.split('.');
            const rParts = requiredPerm.split('.');

            // Match wildcards like "employees.*" or "employees.view.*"
            return pParts.every((part, i) => part === '*' || part === rParts[i]);
        });
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    let userData = userDoc.exists() ? userDoc.data() : null;

                    // Support legacy lookup by email if UID doc doesn't exist
                    if (!userData && user.email) {
                        const q = query(collection(db, "users"), where("email", "==", user.email));
                        const snapshot = await getDocs(q);
                        if (!snapshot.empty) {
                            userData = snapshot.docs[0].data();
                            setProfile({ id: snapshot.docs[0].id, ...userData });
                        }
                    } else if (userData) {
                        setProfile({ id: userDoc.id, ...userData });
                    }

                    if (userData) {
                        setRole(userData.role || "crewMember");

                        // Fetch permissions from roles
                        const roleIds = userData.roleIds || (userData.role ? [userData.role] : []);
                        let allPerms: string[] = [];

                        for (const roleId of roleIds) {
                            const roleDoc = await getDoc(doc(db, "roles", roleId));
                            if (roleDoc.exists()) {
                                const roleData = roleDoc.data();
                                allPerms = [...allPerms, ...(roleData.permissions || [])];

                                // Support simple inheritance (one level for now)
                                if (roleData.parentId) {
                                    const parentDoc = await getDoc(doc(db, "roles", roleData.parentId));
                                    if (parentDoc.exists()) {
                                        allPerms = [...allPerms, ...(parentDoc.data().permissions || [])];
                                    }
                                }
                            }
                        }

                        // Legacy fallback for the transition period
                        if (allPerms.length === 0 && userData.permissions) {
                            allPerms = Object.entries(userData.permissions)
                                .filter(([_, val]) => val === true)
                                .map(([key]) => `${key}.view`); // Map old keys to .view scope
                            if (userData.role === 'superAdmin') allPerms.push('*.*.*');
                        }

                        setPermissions([...new Set(allPerms)]);
                    } else {
                        setRole("crewMember");
                        setPermissions([]);
                    }
                } catch (err) {
                    console.error("RBAC Initialization Error:", err);
                    setRole("crewMember");
                    setPermissions([]);
                }
            } else {
                setProfile(null);
                setRole(null);
                setPermissions([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const hasPermission = (permission: string) => {
        return checkPermission(permissions, permission);
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, role, permissions, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
