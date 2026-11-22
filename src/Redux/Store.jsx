/* eslint-disable react-refresh/only-export-components */
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import planReducer from './Reducer/PlanReducer';
import CustomerReducer from './Reducer/CustomerReducer';
import CollectionReducer from './Reducer/CollectionReducer';
import { registerLogoutHandler } from '../Common/authUtils';

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
};

const appReducer = combineReducers({
  plan: planReducer,
  customer: CustomerReducer,
  collection: CollectionReducer,
});

const rootReducer = (state, action) => {
  if (action.type === 'auth/logout') {
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const Store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(Store);

registerLogoutHandler(() => {
  Store.dispatch({ type: 'auth/logout' });
  persistor.purge();
});

export default Store;
