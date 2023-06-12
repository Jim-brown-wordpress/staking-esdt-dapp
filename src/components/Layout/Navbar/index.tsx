import React from 'react';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { logout } from '@multiversx/sdk-dapp/utils';
import { Navbar as BsNavbar, Nav, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { routeNames } from 'routes';
import { ReactComponent as CPCLogo } from './../../../assets/img/cyberpunk-city-logo.svg';
import { ReactComponent as Lightning } from './../../../assets/img/lightning.svg';

import './index.scss';

const Navbar = () => {
  const navigate = useNavigate();
  const { address } = useGetAccountInfo();

  const handleLogout = () => {
    logout(`${window.location.origin}/unlock`);
  };
  const handleLogin = () => {
    navigate(routeNames.unlock, { replace: true });
  };

  const isLoggedIn = Boolean(address);

  return (
    <BsNavbar
      collapseOnSelect
      className='navbar-cpc'
      expand='md'
      variant='light'
    >
      <Container className='custom-navbar-container' fluid>
        <BsNavbar.Brand>
          <Link
            className='d-flex align-items-center navbar-brand mr-0'
            to={routeNames.home}
          >
            <CPCLogo className='cpc-logo' />
          </Link>
        </BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls='responsive-navbar-nav' />
        <BsNavbar.Collapse id='responsive-navbar-nav' className='nav-menu-wrap'>
          <Nav id='responsive-navbar-nav' className='ml-auto'>

            <Nav.Link
            href='https://kyc.cyberpunkcity.com/'
              className='navbar-links kyc'
            >
              KYC
            </Nav.Link>

            <Link
              className='navbar-links'
              to={routeNames.home}
              aria-current='page'
            >
              STAKE CYBER
            </Link>

            <Link
              className='navbar-links'
              to={routeNames.sft}
              aria-current='page'
            >
              STAKE CityNFT
            </Link>
          </Nav>
          {isLoggedIn ? (
            <button
              className='is-style-cpc-btn-styled connect'
              onClick={handleLogout}
            >
              <Lightning className='mr-1' />
              DISCONNECT
            </button>
          ) : (
            <button
              className='is-style-cpc-btn-styled connect'
              onClick={handleLogin}
            >
              <Lightning className='mr-1' />
              CONNECT
            </button>
          )}
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
};

export default Navbar;
