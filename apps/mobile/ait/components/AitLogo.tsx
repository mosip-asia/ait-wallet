import React from 'react';
import Svg, {Rect, Text, SvgProps} from 'react-native-svg';
import {palette} from '../theme/tokens';

type LogoProps = SvgProps & {color1?: string; color2?: string};

/** Wallet wordmark; credential issuer logos continue to come from metadata. */
export const AitLogo: React.FC<LogoProps> = ({
  width = 220,
  height = 64,
  color1: _color1,
  color2: _color2,
  ...props
}) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 220 64"
    accessibilityLabel="AIT Wallet"
    {...props}>
    <Rect width={64} height={64} rx={16} fill={palette.primary} />
    <Text
      x={32}
      y={41}
      textAnchor="middle"
      fontSize={25}
      fontWeight="800"
      fill={palette.surfaceWhite}>
      AIT
    </Text>
    <Text x={78} y={42} fontSize={33} fontWeight="700" fill={palette.primary}>
      Wallet
    </Text>
  </Svg>
);

export const AitMark: React.FC<SvgProps> = props => (
  <Svg width={40} height={40} viewBox="0 0 64 64" accessibilityLabel="AIT" {...props}>
    <Rect width={64} height={64} rx={16} fill={palette.primary} />
    <Text
      x={32}
      y={41}
      textAnchor="middle"
      fontSize={25}
      fontWeight="800"
      fill={palette.surfaceWhite}>
      AIT
    </Text>
  </Svg>
);
