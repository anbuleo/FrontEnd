import {configureStore} from '@reduxjs/toolkit'
import storage from "redux-persist/lib/storage"
import {persistReducer} from 'redux-persist'
import {combineReducers} from '@reduxjs/toolkit'
import planReducer from "./Reducer/PlanReducer"
import CustomerReducer from './Reducer/CustomerReducer'
import CollectionReducer from "./Reducer/CollectionReducer"
// import { version } from 'react'


const persistConfig = {
    key:'root',
    version:1,
    storage
}
const reducer = combineReducers({
  plan:planReducer,
  customer:CustomerReducer,
  collection:CollectionReducer
})
const persistedReducer = persistReducer(persistConfig,reducer)

   

export default configureStore({
  reducer : persistedReducer
})