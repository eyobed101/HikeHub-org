import { combineReducers } from 'redux';

// Reducer imports
// import customizationReducer from './customizationReducer';
import authReducer from './authSlice'; // Import your auth reducer

// ==============================|| COMBINE REDUCER ||============================== //

const reducer = combineReducers({
  // customization: customizationReducer,
  auth: authReducer, // Add auth reducer
});

export type RootState = ReturnType<typeof reducer>; // Define RootState type

export default reducer;