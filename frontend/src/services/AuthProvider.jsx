import { Auth0Provider } from '@auth0/auth0-react';
import PropTypes from 'prop-types';

export function AuthProvider({ children }) {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const redirectUri = window.location.origin;

  if (!domain || !clientId) {
    console.warn('Auth0 configuration missing; authentication is disabled.');
    return children;
  }

  return (
    <Auth0Provider domain={domain} clientId={clientId} authorizationParams={{ redirect_uri: redirectUri }}>
      {children}
    </Auth0Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};
