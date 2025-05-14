import "@/styles/globals.css";
import { TagMenu } from "./components/TagMenu";
import { AppProvider } from "./components/AppContext";
import { ToastProvider } from "./components/ToastProvider";

function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <TagMenu />
      </AppProvider>
    </ToastProvider>
  );
}

export default App;
