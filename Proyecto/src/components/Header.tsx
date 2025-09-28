import React, { useState } from "react";
import {
  CCollapse,
  CContainer,
  CNavbar,
  CNavbarBrand,
  CNavbarToggler,
  CNavbarNav,
  CNavItem,
  CNavLink,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
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
            {/* Sección Hola Mundo */}
            <CNavItem>
              <CNavLink
                onClick={() => setActiveTab("hello")}
                style={{ cursor: "pointer" }}
              >
                Hola Mundo
              </CNavLink>
            </CNavItem>

            {/* Sección Tarjetas */}
            <CNavItem>
              <CNavLink
                onClick={() => setActiveTab("tarjetas")}
                style={{ cursor: "pointer" }}
              >
                Tarjetas
              </CNavLink>
            </CNavItem>

            {/* Dropdown de Cuentas */}
            <CDropdown variant="nav-item" popper={false}>
              <CDropdownToggle style={{ cursor: "pointer" }}>
                Cuentas
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem onClick={() => setActiveTab("cuentas")}>
                  Ver Cuentas
                </CDropdownItem>
                <CDropdownItem onClick={() => setActiveTab("registroCuenta")}>
                  Registrar Nueva Cuenta
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </CNavbarNav>
        </CCollapse>
      </CContainer>
    </CNavbar>
  );
};

export default Header;
