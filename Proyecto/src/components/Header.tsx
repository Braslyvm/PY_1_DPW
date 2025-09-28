import React, { useState } from "react";
import {
  CButton,
  CCollapse,
  CContainer,
  CNavbar,
  CNavbarBrand,
  CNavbarToggler,
  CNavbarNav,
  CNavItem,
  CNavLink,
} from "@coreui/react";

interface HeaderProps {
  setActiveTab: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ setActiveTab }) => {
  const [visible, setVisible] = useState(false);

  return (
    <CNavbar expand="lg" colorScheme="dark" className="bg-dark">
      <CContainer fluid>
        <CNavbarBrand href="#">Mi Dashboard</CNavbarBrand>
        <CNavbarToggler
          aria-label="Toggle navigation"
          aria-expanded={visible}
          onClick={() => setVisible(!visible)}
        />
        <CCollapse className="navbar-collapse" visible={visible}>
          <CNavbarNav className="me-auto">
            <CNavItem>
              <CNavLink
                onClick={() => setActiveTab("hello")}
                style={{ cursor: "pointer" }}
              >
                Hola Mundo
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                onClick={() => setActiveTab("cuentas")}
                style={{ cursor: "pointer" }}
              >
                Cuentas
              </CNavLink>
            </CNavItem>
          </CNavbarNav>
        </CCollapse>
      </CContainer>
    </CNavbar>
  );
};
export default Header;
