import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import ListingDetail from './pages/ListingDetail'
import CreateListing from './pages/CreateListing'
import MyOrders from './pages/MyOrders'
import OrderDetail from './pages/OrderDetail'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import Profile from './pages/Profile'
import { WalletProvider } from './context/WalletContext'

function App() {
  return (
    <WalletProvider>
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0f' }}>
          <Navigation />
          <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/sell" element={<CreateListing />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/order/:id" element={<OrderDetail />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </WalletProvider>
  )
}

export default App
