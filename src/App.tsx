import { RouterProvider } from "react-router/dom";
import { Toaster } from "sonner";
import { router } from "./router";
import { ThemeProvider } from "@/components/theme-provider";

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="testlab-theme">
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  );
}
