// project imports
import config from 'config';

// action - state management
import * as actionTypes from './actions';


// Define the shape of the state
export interface CustomizationState {
  isOpen: string[]; // Array of open menu IDs
  defaultId: string;
  fontFamily: string;
  borderRadius: number;
  opened: boolean;
}

// Define the initial state
// export const initialState: CustomizationState = {
//   isOpen: [], // for active default menu
//   defaultId: 'default',
//   fontFamily: config.fontFamily ,
//   borderRadius: config.borderRadius,
//   opened: true,
// };

// Define the shape of actions
interface MenuOpenAction {
  type: typeof actionTypes.MENU_OPEN;
  id: string;
}

interface SetMenuAction {
  type: typeof actionTypes.SET_MENU;
  opened: boolean;
}

interface SetFontFamilyAction {
  type: typeof actionTypes.SET_FONT_FAMILY;
  fontFamily: string;
}

interface SetBorderRadiusAction {
  type: typeof actionTypes.SET_BORDER_RADIUS;
  borderRadius: number;
}

type CustomizationActions =
  | MenuOpenAction
  | SetMenuAction
  | SetFontFamilyAction
  | SetBorderRadiusAction;

// ==============================|| CUSTOMIZATION REDUCER ||============================== //

// const customizationReducer = (
//   // state: CustomizationState = initialState,
//   action: CustomizationActions
// ): CustomizationState => {
//   switch (action.type) {
//     case actionTypes.MENU_OPEN:
//       return {
//         ...state,
//         isOpen: [action.id],
//       };
//     case actionTypes.SET_MENU:
//       return {
//         ...state,
//         opened: action.opened,
//       };
//     case actionTypes.SET_FONT_FAMILY:
//       return {
//         ...state,
//         fontFamily: action.fontFamily,
//       };
//     case actionTypes.SET_BORDER_RADIUS:
//       return {
//         ...state,
//         borderRadius: action.borderRadius,
//       };
//     default:
//       return state;
//   }
// };

// export default customizationReducer;