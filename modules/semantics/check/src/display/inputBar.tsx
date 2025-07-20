import React from "react";
import { GetterSetter } from "@lenscape/context";

export type InputBarProps = {
    ops: GetterSetter<string>;
    onEnter?: (query: string) => void;
    options?: string[];
};

export function InputBar({ ops, onEnter, options = [] }: InputBarProps) {
    const [query, setQuery] = ops;

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Enter") {
            event.preventDefault();
            onEnter?.(query);
        }
    }

    function handleSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const selectedValue = event.target.value;
        setQuery(selectedValue);
        onEnter?.(selectedValue);
    }

    return (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask something..."
                style={{
                    flex: 1,
                    padding: "0.5rem",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                }}
            />
            {options.length > 0 && (
                <select
                    value=""
                    onChange={handleSelectChange}
                    style={{
                        padding: "0.5rem",
                        fontSize: "1rem",
                    }}
                >
                    <option value="" disabled hidden>Select…</option>
                    {options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
}
