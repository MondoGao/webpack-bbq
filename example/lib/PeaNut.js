'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _xhrRequest = require('xhr-request');

var _xhrRequest2 = _interopRequireDefault(_xhrRequest);

var _reactRedux = require('react-redux');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var fetchPeanutFoo = function fetchPeanutFoo(_ref) {
  var request = _ref.request;
  var dispatch = _ref.dispatch;
  var headers = _ref.headers;
  var cb = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

  request('/api/peanut/-/foo', { json: true, headers: headers }, function (err, payload) {
    var action = {};
    if (err) {
      action.type = 'FETCH_PEANUT_FOO_FAIL';
      action.error = true;
      action.payload = err;
    } else {
      action.type = 'FETCH_PEANUT_FOO_SUCCESS';
      action.payload = payload.foo;
    }
    dispatch(action);
    if (cb) cb();
  });
};

var PeaNut = function (_Component) {
  _inherits(PeaNut, _Component);

  function PeaNut() {
    var _Object$getPrototypeO;

    _classCallCheck(this, PeaNut);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(PeaNut)).call.apply(_Object$getPrototypeO, [this].concat(args)));

    _this.handleClick = _this.handleClick.bind(_this);
    return _this;
  }

  _createClass(PeaNut, [{
    key: 'handleClick',
    value: function handleClick() {
      fetchPeanutFoo({
        request: _xhrRequest2.default,
        dispatch: this.props.dispatch,
        headers: {
          'x-requested-with': 'XMLHttpRequest'
        }
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var foo = this.props.foo;

      return _react2.default.createElement(
        'div',
        { onClick: this.handleClick },
        'I am a PeaNut',
        _react2.default.createElement('br', null),
        'Click Me!',
        _react2.default.createElement(
          'p',
          null,
          'foo: ',
          foo
        )
      );
    }
  }]);

  return PeaNut;
}(_react.Component);

PeaNut.getInitialData = fetchPeanutFoo;

exports.default = (0, _reactRedux.connect)(function (state) {
  return {
    foo: state.peanut.foo
  };
})(PeaNut);
module.exports = exports['default'];