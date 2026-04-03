import { BrowserRouter } from "react-router-dom";

import { SessionProvider } from "../lib/auth";
import { AppRoutes } from "./routes";

export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </BrowserRouter>
  );
}
