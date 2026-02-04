import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import Home from './pages/Home'
import Calculator from './pages/Calculator'
import Dashboard from './pages/Dashboard'
import Guide from './pages/Guide'
import AlgorithmDetail from './pages/AlgorithmDetail'
import AdminPanel from './pages/AdminPanel'

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navigation />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/mine/:algoName" element={<AlgorithmDetail />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  )
}

export default App
