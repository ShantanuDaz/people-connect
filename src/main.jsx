import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import App from "./App.jsx";
import { AuthWrapper, SignInSignUp } from "./features/auth";
import { GlobalError } from "./components/GlobalError.jsx";
import { Chat } from "./features/chat";
import { UserSettings } from "./features/user";

// Polyfill Buffer for bip39 and other crypto libraries in the browser
import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;

const router = createBrowserRouter([
  {
    path: "/login",
    element: <SignInSignUp />,
    errorElement: <GlobalError />
  },
  {
    element: <AuthWrapper />,
    errorElement: <GlobalError />,
    children: [
      {
        path: "/",
        element: <App />,
        children: [
          {
            index: true,
            element: <Navigate to="/chat" replace />,
          },
          {
            path: "chat",
            element: <Chat />,
          },
          {
            path: "settings",
            element: <UserSettings />,
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
