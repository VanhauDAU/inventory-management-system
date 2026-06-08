const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function App() {
  return (
    <div className="app-container">
      <h1>Project Management Frontend</h1>
      <p>Backend API: <code>{apiUrl}</code></p>
    </div>
  )
}

export default App
