import type React from "react";

interface InlineCodeProps {
	children: React.ReactNode;
}

const InlineCode: React.FC<InlineCodeProps> = ({ children }) => {
	return (
		<code className="dark:bg-blue-900 bg-gray-100 text-pink-600 px-1 py-0.5 rounded font-mono text-sm">
			{children}
		</code>
	);
};

export default InlineCode;
