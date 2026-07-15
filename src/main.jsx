import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import App from "./App.jsx";
import { AuthWrapper, GuestWrapper, Login, Pairing } from "./features/auth";
import { Onboarding } from "./features/onboarding";
import { GlobalError } from "./components/GlobalError.jsx";
import { Chat } from "./features/chat";
import { UserSettings } from "./features/user";

// Polyfill Buffer for bip39 and other crypto libraries in the browser
import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;

const router = createBrowserRouter([
  {
    element: <GuestWrapper />,
    errorElement: <GlobalError />,
    children: [
      {
        path: "/signup",
        element: <Onboarding />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/pairing",
        element: <Pairing />,
      }
    ]
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
