import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { installSelectionNavigation } from './frontend/selectionNavigation'

const stopSelectionNavigation = installSelectionNavigation()
import.meta.hot?.dispose(stopSelectionNavigation)

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
