import { Easing } from 'react-native-reanimated';

/** cubic-bezier(.2,.8,.2,1): the ease-out used everywhere in the design. */
export const easeOut = Easing.bezier(0.2, 0.8, 0.2, 1);

/** cubic-bezier(.3,1.6,.5,1): springy overshoot for pops (splash nodes, success badge). */
export const easePop = Easing.bezier(0.3, 1.6, 0.5, 1);

export const easeInOut = Easing.inOut(Easing.ease);
