// @ts-ignore - Ignoring missing type definitions for language imports
import type React from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
// @ts-ignore
import { jsx } from "react-syntax-highlighter/dist/esm/languages/prism";
// @ts-ignore
import { typescript } from "react-syntax-highlighter/dist/esm/languages/prism";
// @ts-ignore
import { javascript } from "react-syntax-highlighter/dist/esm/languages/prism";
// @ts-ignore
import { rust } from "react-syntax-highlighter/dist/esm/languages/prism";
// @ts-ignore
import { bash } from "react-syntax-highlighter/dist/esm/languages/prism";
// @ts-ignore
import { json } from "react-syntax-highlighter/dist/esm/languages/prism";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// Register languages
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("rust", rust);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("json", json);

interface CodeProps {
	code: string;
	language?: string;
	showLineNumbers?: boolean;
	fileName?: string;
	wrapLongLines?: boolean;
	className?: string;
}

const Code: React.FC<CodeProps> = ({
	code,
	language = "typescript",
	showLineNumbers = true,
	fileName,
	wrapLongLines = false,
	className = "",
}) => {
	return (
		<div className={`overflow-hidden rounded-lg shadow-sm ${className}`}>
			{fileName && (
				<div className="bg-gray-800 text-gray-300 px-4 py-2 text-sm font-fira-code border-b border-gray-700">
					{fileName}
				</div>
			)}
			<div className="relative">
				<SyntaxHighlighter
					language={language}
					style={vscDarkPlus}
					showLineNumbers={showLineNumbers}
					wrapLongLines={wrapLongLines}
					customStyle={{
						margin: 0,
						borderRadius: fileName ? "0 0 0.5rem 0.5rem" : "0.5rem",
						fontFamily: "'Fira Code', monospace",
						fontSize: "0.875rem", // 14px
						lineHeight: "1.5",
						padding: "1rem",
					}}
					codeTagProps={{
						style: {
							fontFamily: "'Fira Code', monospace",
						},
					}}
					className="font-fira-code"
				>
					{code.trim()}
				</SyntaxHighlighter>
			</div>
		</div>
	);
};

export default Code;
