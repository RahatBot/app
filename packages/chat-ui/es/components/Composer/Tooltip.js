import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";
import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
import React, { useState, useEffect } from 'react';
var Tooltip = function Tooltip(_ref) {
  var children = _ref.children,
    content = _ref.content;
  var _useState = useState(false),
    _useState2 = _slicedToArray(_useState, 2),
    isVisible = _useState2[0],
    setIsVisible = _useState2[1];
  var showTooltip = function showTooltip() {
    return setIsVisible(true);
  };
  var hideTooltip = function hideTooltip() {
    return setIsVisible(false);
  };
  var _useState3 = useState({
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
    _useState4 = _slicedToArray(_useState3, 2),
    tooltipStyle = _useState4[0],
    setTooltipStyle = _useState4[1];
  useEffect(function () {
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
  return /*#__PURE__*/React.createElement("div", {
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
  React.createElement("div", {
    style: tooltipStyle
  }, content));
};
export default Tooltip;