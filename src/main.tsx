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
import store, { zz } from './store/store';
import { Provider } from 'react-redux';
import { ToastContainer } from "react-toastify";
import { GoogleOAuthProvider } from "@react-oauth/google";



import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ConfigProvider, theme as antdTheme } from "antd";
import { useTheme } from "./context/ThemeContext.tsx";

const queryClient = new QueryClient();

function AntdConfigProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <ConfigProvider
      theme={{
        algorithm: theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          fontFamily: "Outfit, sans-serif",
          colorPrimary: "#465fff",
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ToastContainer
          position="top-left"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          style={{ zIndex: 9999 }} />
        <StrictMode>
          <ThemeProvider>
            <AntdConfigProvider>
              <AppWrapper>
                <AuthProvider>
                  <App />
                </AuthProvider>
              </AppWrapper>
            </AntdConfigProvider>
          </ThemeProvider>
        </StrictMode>
      </QueryClientProvider>
    </Provider>
  </GoogleOAuthProvider>
);
