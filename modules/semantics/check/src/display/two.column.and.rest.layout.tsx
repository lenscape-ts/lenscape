import React, {useEffect, useState} from "react";


export type TwoColumnAndRestLayoutProps = {
    rootId?: string;
    children: React.ReactNode;
};


export const TwoColumnAndRestLayout = ({rootId, children}: TwoColumnAndRestLayoutProps) => {
    const childrenArray = React.Children.toArray(children);
    const [first, second, ...rest] = childrenArray;

    const [isNarrow, setIsNarrow] = useState(window.innerWidth < 600);

    useEffect(() => {
        const handleResize = () => setIsNarrow(window.innerWidth < 600);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    const styles: Record<string, React.CSSProperties> = {
        container: {
            display: "flex",
            flexDirection: "column",
            width: "100%",
        },
        topRow: {
            display: "flex",
            flexDirection: isNarrow ? "column" : "row",
            width: "100%",
            gap: "10px",
        },
        column: {
            flex: isNarrow ? "none" : "1 1 0",  // IMPORTANT: Disable flex in narrow mode
            width: isNarrow ? "100%" : undefined,  // Full width when stacked
            padding: "10px",
            boxSizing: "border-box",
            minWidth: 0, // always keep minWidth:0 to handle overflow properly
            overflow: "auto", // allow overflow content to scroll neatly
        },
        rest: {
            marginTop: "20px",
            padding: "10px",
            boxSizing: "border-box",
        },
    };

    return (
        <div data-testid={rootId} style={styles.container}>
            <div data-testid={`${rootId}.topRow`} style={styles.topRow}>
                <div data-testid={`${rootId}.first`} style={styles.column}>{first}</div>
                <div data-testid={`${rootId}.second`} style={styles.column}>{second}</div>
            </div>
            {rest.length > 0 && <div data-testid={`${rootId}.rest`} style={styles.rest}>{rest}</div>}
        </div>
    );
};
