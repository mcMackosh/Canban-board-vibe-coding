/** App shell + router. Auth pages are public; the board is guarded. */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';
import { BoardPage } from './pages/BoardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/board"
            element={
              <RequireAuth>
                <BoardPage />
              </RequireAuth>
            }
          />
          <Route path="/" element={<Navigate to="/board" replace />} />
          <Route path="*" element={<Navigate to="/board" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
