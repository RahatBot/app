"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _typeof = require("@babel/runtime/helpers/typeof");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _react = _interopRequireWildcard(require("react"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2.default)(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
var Tooltip = function Tooltip(_ref) {
  var children = _ref.children,
    content = _ref.content;
  var _useState = (0, _react.useState)(false),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    isVisible = _useState2[0],
    setIsVisible = _useState2[1];
  var showTooltip = function showTooltip() {
    return setIsVisible(true);
  };
  var hideTooltip = function hideTooltip() {
    return setIsVisible(false);
  };
  var _useState3 = (0, _react.useState)({
      position: 'absolute',
      bottom: '100%',
      left: '0',
      transform: 'translateX(8px)',
      backgroundColor: 'black',
      color: 'white',
      padding: '8px',
      borderRadius: '4px',
      whiteSpace: 'normal',
      zIndex: 10,
      opacity: 0.75,
      overflowWrap: 'break-word',
      wordWrap: 'break-word',
      width: '200px',
      maxWidth: '80vw' // Default maxWidth
    }),
    _useState4 = (0, _slicedToArray2.default)(_useState3, 2),
    tooltipStyle = _useState4[0],
    setTooltipStyle = _useState4[1];
  (0, _react.useEffect)(function () {
    // Dynamically adjust maxWidth based on screen width
    var updateTooltipMaxWidth = function updateTooltipMaxWidth() {
      var screenWidth = window.innerWidth;
      var width = screenWidth < 480 ? '80vw' : '30vw';
      setTooltipStyle(function (prevStyle) {
        return _objectSpread(_objectSpread({}, prevStyle), {}, {
          width: width
        });
      });
    };
    window.addEventListener('resize', updateTooltipMaxWidth);
    updateTooltipMaxWidth(); // Initial adjustment

    return function () {
      return window.removeEventListener('resize', updateTooltipMaxWidth);
    };
  }, []);
  return /*#__PURE__*/_react.default.createElement("div", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center'
    },
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip
  }, children, isVisible &&
  /*#__PURE__*/
  //@ts-ignore
  _react.default.createElement("div", {
    style: tooltipStyle
  }, content));
};
var _default = exports.default = Tooltip;