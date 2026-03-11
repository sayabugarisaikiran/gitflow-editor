import Layout from './components/Layout';
import { useURLState } from './hooks/useURLState';
import './index.css';

export default function App() {
    // Load shared scenario from URL hash on mount
    useURLState();
    return <Layout />;
}
