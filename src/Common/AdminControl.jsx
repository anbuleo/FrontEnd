import React from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import WaittingForApproval from '../Pages/WaittingForApproval'

function AdminControl({children}) {
    let datas = localStorage.getItem('data');
     let data = JSON.parse(datas)
    let con1 = data.approved == true
    let condition = data.role == 'admin'
    // console.log(data)
    if(!condition) {
        toast.warning('Admin only')
    }

  return con1 ? condition ? children  : <Navigate to='/home' /> : <WaittingForApproval />
}

export default AdminControl