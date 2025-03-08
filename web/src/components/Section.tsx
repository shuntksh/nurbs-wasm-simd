import type React from "react";

interface SectionProps {
	id?: string;
	children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ id, children }) => {
	return (
		<section
			id={id}
			className="py-8 bg-white dark:bg-gray-800 md:rounded-lg md:shadow-md p-4 md:p-6 md:mb-12 text-gray-900 dark:text-gray-100"
		>
			<div className="section-content [&_*]:text-inherit">{children}</div>
		</section>
	);
};

export default Section;
