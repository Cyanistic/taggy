import "@/styles/globals.css";
import { TagMenu } from "./components/TagMenu";
import { AppProvider } from "./components/AppContext";

function App() {
  return (
    <AppProvider>
      <TagMenu />
    </AppProvider>
  );
}

export default App;
