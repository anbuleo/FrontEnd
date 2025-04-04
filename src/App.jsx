import React from "react"
import {BrowserRouter,Routes,Route} from "react-router-dom"
import SignIn from "./Pages/SignIn"
import SignUp from "./Pages/SignUp"
import Home from "./Pages/Home"
import ProdectedRoute from "./Common/ProdectedRoute"
import AdminControl from "./Common/AdminControl"
import Customer from "./Pages/Customer"
import Plan from "./Pages/Plan"
import Collection from "./Pages/Collection"
import Admin from "./Pages/Admin"
import Report from "./Pages/Report"
import Expense from "./Pages/Expense"
import DailyCollection from "./Pages/DailyCollection"

function App() {
 

  return (
   <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/home" element={<ProdectedRoute><Home /></ProdectedRoute>} />
          {/* <Route path="/home" element={<Home />} /> */}
          <Route path="/customer" element={<ProdectedRoute><Customer /></ProdectedRoute>} />
          <Route path="/plan" element={<ProdectedRoute><Plan /></ProdectedRoute>} />
          <Route path="/dailycollection" element={<ProdectedRoute><DailyCollection /></ProdectedRoute>} />
          <Route path="/expense" element={<ProdectedRoute><Expense /></ProdectedRoute>} />
          <Route path="/collection" element={<ProdectedRoute><Collection /></ProdectedRoute>} />
          <Route path="/admin" element={<ProdectedRoute><AdminControl><Report /></AdminControl></ProdectedRoute>} />

        </Routes>
      </BrowserRouter>
   </>
  )
}

export default App
