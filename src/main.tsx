import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "simplebar-react/dist/simplebar.min.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter as Router } from "react-router-dom"; // Correct import
import store, { persistor } from './store/store';
import { Provider } from 'react-redux';



createRoot(document.getElementById("root")!).render(
  <Provider store={store}>

  <StrictMode>
    <ThemeProvider>
      <AppWrapper>
        <AuthProvider>
          <Router> {/* Ensure Router wraps everything */}
            <App />
          </Router>
        </AuthProvider>
      </AppWrapper>
    </ThemeProvider>
  </StrictMode>
  </Provider>
);
