import {CSSProperties, ReactNode} from "react";

export interface ClipHeightProps {
    children: ReactNode;
    maxHeight: string;  // e.g., "200px", "50vh"
    scrollable?: boolean;
    force?: boolean;  // Force height if true
}

export type ClipHeight = (props: ClipHeightProps) => ReactNode;

export const ClipHeight: ClipHeight = ({children, maxHeight, scrollable = false, force = false}: ClipHeightProps) => {
    const containerStyle: CSSProperties = {
        maxHeight,  // Applies maxHeight normally
        overflowY: scrollable ? 'auto' : 'hidden',
        height: force ? maxHeight : undefined,  // Force exact height when 'force' is true
    };

    return (
        <div style={containerStyle}>
            {children}
        </div>
    );
};

