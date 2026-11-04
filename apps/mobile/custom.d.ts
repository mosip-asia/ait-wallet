declare module '*.svg' {
  import type {FunctionComponent} from 'react';
  import {SvgProps} from 'react-native-svg';
  const content: FunctionComponent<
    SvgProps & {color1?: string; color2?: string; color3?: string}
  >;
  export default content;
}
