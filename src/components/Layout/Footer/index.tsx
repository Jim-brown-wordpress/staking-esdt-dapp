import React from 'react';
import { ReactComponent as HeartIcon } from '../../../assets/img/heart.svg';
import logoGif from './../../../assets/img/logo.gif';

const Footer = () => {
  return (
    <footer className='text-center mt-2 mb-3'>
      <img src={logoGif} className='cpc-logo-gif' alt='Cyberpunk City' />
      <br />
      <div>
        <a
          {...{
            target: '_blank'
          }}
          className='d-flex align-items-center'
          href='https://cyberpunkcity.com/'
        >
          Made with <HeartIcon className='mx-1' /> by Cyberpunk City.
        </a>
      </div>
    </footer>
  );
};

export default Footer;
