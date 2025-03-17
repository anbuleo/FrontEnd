import React from 'react'
import WaittingForApproval from '../Pages/WaittingForApproval'
import { Navigate } from 'react-router-dom'

function ProdectedRoute({children}) {
    const token = sessionStorage.getItem('token')
    let datas = localStorage.getItem('data')
    let data = JSON.parse(datas)
   let con1 = data?.approved == true

    if(!token){
        sessionStorage.clear()
        localStorage.clear()
    }
  return token ? con1? children :<WaittingForApproval />: <Navigate to='/' />
}

export default ProdectedRoute