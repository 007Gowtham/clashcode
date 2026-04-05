import { cn } from "@/lib/utils";

export function TypographyH1({ className, children }) {
    return (
        <h1 className={cn("scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-balance", className)}>
            {children}
        </h1>
    );
}

export function TypographyH2({ className, children }) {
    return (
        <h2 className={cn("scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0", className)}>
            {children}
        </h2>
    );
}

export function TypographyH3({ className, children }) {
    return (
        <h3 className={cn("scroll-m-20 text-2xl font-semibold tracking-tight", className)}>
            {children}
        </h3>
    );
}

export function TypographyH4({ className, children }) {
    return (
        <h4 className={cn("scroll-m-20 text-xl font-semibold tracking-tight", className)}>
            {children}
        </h4>
    );
}

export function TypographyP({ className, children }) {
    return (
        <p className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}>
            {children}
        </p>
    );
}

export function TypographyBlockquote({ className, children }) {
    return (
        <blockquote className={cn("mt-6 border-l-2 pl-6 italic", className)}>
            {children}
        </blockquote>
    );
}

export function TypographyList({ className, items = [] }) {
    return (
        <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}>
            {items.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
        </ul>
    );
}

export function TypographyInlineCode({ className, children }) {
    return (
        <code className={cn("bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold", className)}>
            {children}
        </code>
    );
}

export function TypographyLead({ className, children }) {
    return (
        <p className={cn("text-xl text-muted-foreground", className)}>
            {children}
        </p>
    );
}

export function TypographyLarge({ className, children }) {
    return <div className={cn("text-lg font-semibold", className)}>{children}</div>;
}

export function TypographySmall({ className, children }) {
    return (
        <small className={cn("text-sm font-medium leading-none", className)}>{children}</small>
    );
}

export function TypographyMuted({ className, children }) {
    return (
        <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
    );
}

export function TypographyMono({ className, children }) {
    return (
        <code className={cn("font-mono text-sm font-medium tracking-tight", className)}>
            {children}
        </code>
    );
}
