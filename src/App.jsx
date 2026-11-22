import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './Pages/SignIn';
import SignUp from './Pages/SignUp';
import Home from './Pages/Home';
import ProdectedRoute from './Common/ProdectedRoute';
import AdminControl from './Common/AdminControl';
import Customer from './Pages/Customer';
import Plan from './Pages/Plan';
import Collection from './Pages/Collection';
import Report from './Pages/Report';
import Expense from './Pages/Expense';
import DailyCollection from './Pages/DailyCollection';
import Services from './Pages/Services';
import GstInvoices from './Pages/GstInvoices';
import ErrorBoundary from './Common/ErrorBoundary';
import { getAuthToken, getStoredUser } from './Common/authUtils';

function PublicRoute({ children }) {
  const token = getAuthToken();
  const user = getStoredUser();
  if (token && user) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <SignIn />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignUp />
              </PublicRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProdectedRoute>
                <Home />
              </ProdectedRoute>
            }
          />
          <Route
            path="/customer"
            element={
              <ProdectedRoute>
                <Customer />
              </ProdectedRoute>
            }
          />
          <Route
            path="/plan"
            element={
              <ProdectedRoute>
                <Plan />
              </ProdectedRoute>
            }
          />
          <Route
            path="/dailycollection"
            element={
              <ProdectedRoute>
                <DailyCollection />
              </ProdectedRoute>
            }
          />
          <Route
            path="/expense"
            element={
              <ProdectedRoute>
                <Expense />
              </ProdectedRoute>
            }
          />
          <Route
            path="/collection"
            element={
              <ProdectedRoute>
                <Collection />
              </ProdectedRoute>
            }
          />
          <Route
            path="/services"
            element={
              <ProdectedRoute>
                <Services />
              </ProdectedRoute>
            }
          />
          <Route
            path="/gst"
            element={
              <ProdectedRoute>
                <GstInvoices />
              </ProdectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProdectedRoute>
                <AdminControl>
                  <Report />
                </AdminControl>
              </ProdectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
