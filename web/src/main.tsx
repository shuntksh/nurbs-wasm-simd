import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
// Import App component without file extension
import App from "./App";
import "./globals.css";

// Get the root element
const rootElement = document.getElementById("root");

// Check if the root element exists
if (rootElement) {
	ReactDOM.createRoot(rootElement).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
} else {
	console.error("Root element not found");
}
