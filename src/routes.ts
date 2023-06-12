import withPageTitle from './components/PageTitle';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Sft from './pages/Sft';

export const routeNames = {
  home: '/',
  sft: '/citynft-staking',
  profile: '/asdasd55',
  unlock: '/unlock',
  ledger: '/ledger',
  walletconnect: '/walletconnect'
};

const routes: Array<any> = [
  {
    path: routeNames.home,
    title: 'Cyberpunk City',
    component: Home
  },
  {
    path: routeNames.sft,
    title: 'Cyberpunk City',
    component: Sft
  },
  {
    path: routeNames.profile,
    title: 'Cyberpunk City',
    component: Profile
  }
];

const mappedRoutes = routes.map((route) => {
  const title =
    'Cyberpunk City dApp | Staking, Lending, DeFi and DAO on the Metaverse';

  const requiresAuth = Boolean(route.authenticatedRoute);
  const wrappedComponent = withPageTitle(title, route.component);

  return {
    path: route.path,
    component: wrappedComponent,
    authenticatedRoute: requiresAuth
  };
});

export default mappedRoutes;
