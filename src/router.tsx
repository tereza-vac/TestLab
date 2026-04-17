import { createBrowserRouter, Navigate } from "react-router";
import { MainLayout } from "@/layouts/MainLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, element: <Navigate to="/prehled" replace /> },
      {
        path: "prehled",
        lazy: () => import("@/pages/DashboardPage"),
      },
      {
        path: "nova-uloha",
        lazy: () => import("@/pages/NewItemPage"),
      },
      {
        path: "moje-ulohy",
        lazy: () => import("@/pages/MyItemsPage"),
      },
      {
        path: "banka-uloh",
        lazy: () => import("@/pages/ItemBankPage"),
      },
      {
        path: "uloha/:id",
        lazy: () => import("@/pages/ItemEditorPage"),
      },
      {
        path: "testy",
        lazy: () => import("@/pages/TestsPage"),
      },
      {
        path: "nastaveni",
        lazy: () => import("@/pages/SettingsPage"),
      },
    ],
  },
]);
