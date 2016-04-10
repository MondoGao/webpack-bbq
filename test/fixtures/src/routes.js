import WebIndexRoute from './WebIndexRoute';
import WebContainer from './WebContainer';

module.exports = {
  path: '/web',
  indexRoute: WebIndexRoute,
  component: WebContainer,
  getChildRoutes: (location, callback) => {
    // TODO 需要一个约定？ 或者 bundle-loader 来解救？
    require.ensure([], () => callback(null, require('./peanut.routes')), 'web/peanut');
  },
};
