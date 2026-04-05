export default function Card({ children, className = '', padding = 'p-6', hover = false, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`
        bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden
        ${hover ? 'hover:shadow-md hover:border-blue-200 transition-all cursor-pointer' : ''}
        ${padding}
        ${className}
      `}
        >
            {children}
        </div>
    );
}
