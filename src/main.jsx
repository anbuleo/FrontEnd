import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import {Provider} from "react-redux"
import { PersistGate } from 'redux-persist/es/integration/react'
import { ToastContainer } from 'react-toastify'
import Store from './Redux/Store.jsx'
import {persistStore} from 'redux-persist'
let persistor = persistStore(Store)
 
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
     <Provider store={Store} >
      <PersistGate  persistor={persistor}>
      <App />
      </PersistGate>
    
    <ToastContainer autoClose={2000} />
    </Provider>
  </React.StrictMode>,
)
