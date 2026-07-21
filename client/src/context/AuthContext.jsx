import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export function AuthProvider({ children }) {
  const [userRole, setUserRole] = useState(null);
  const [token, setToken] = useState(null);
  const [region, setRegion] = useState(null);
  const [userData, setUserData] = useState(null);
  const [regions, setRegions] = useState([
    { id: 1, name: "India" },
    { id: 2, name: "USA" }
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/regions/`);
        if (response.ok) {
          const data = await response.json();
          setRegions(data);
        }
      } catch (err) {
        console.error("Failed to fetch regions:", err);
      }
    };
    fetchRegions();

    const storedToken = localStorage.getItem("authToken");
    const storedRole = localStorage.getItem("userRole");
    const storedRegion = localStorage.getItem("userRegion");
    const storedUser = localStorage.getItem("userData");
    
    if (storedToken && storedRole) {
      setToken(storedToken);
      setUserRole(storedRole);
      setRegion(storedRegion);
      if (storedUser) setUserData(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (role, regionId, jwtToken, userInfo = null) => {
    const authToken = jwtToken;
    setUserRole(role);
    setToken(authToken);
    setRegion(regionId);
    if (userInfo) {
      setUserData(userInfo);
      localStorage.setItem("userData", JSON.stringify(userInfo));
    }
    
    localStorage.setItem("authToken", authToken);
    localStorage.setItem("userRole", role);
    localStorage.setItem("userRegion", regionId);
  };

  const logout = () => {
    setUserRole(null);
    setToken(null);
    setRegion(null);
    setUserData(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userRegion");
    localStorage.removeItem("userData");
  };

  const updateRegion = (regionId) => {
    setRegion(regionId);
    localStorage.setItem("userRegion", regionId);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ userRole, token, region, regions, userData, isAuthenticated, isLoading, login, logout, updateRegion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
