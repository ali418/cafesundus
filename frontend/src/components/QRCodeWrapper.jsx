import React from 'react';
import PropTypes from 'prop-types';
import { QRCodeSVG } from 'qrcode.react';

// مكوّن غلاف بسيط يمرر الخصائص لمكوّن QRCodeSVG الحقيقي
const QRCodeWrapper = ({ value, size = 128, level = 'M', includeMargin = false, bgColor = '#ffffff', fgColor = '#000000', style = {} }) => {
  return (
    <div 
      style={{
        width: size,
        height: size,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: includeMargin ? '8px' : 0,
        borderRadius: '4px',
        backgroundColor: bgColor,
        ...style
      }}
    >
      <QRCodeSVG
        value={value || ''}
        size={size}
        level={level}
        includeMargin={includeMargin}
        bgColor={bgColor}
        fgColor={fgColor}
      />
    </div>
  );
};

QRCodeWrapper.propTypes = {
  value: PropTypes.string.isRequired,
  size: PropTypes.number,
  level: PropTypes.oneOf(['L', 'M', 'Q', 'H']),
  includeMargin: PropTypes.bool,
  bgColor: PropTypes.string,
  fgColor: PropTypes.string,
  style: PropTypes.object
};

export default QRCodeWrapper;