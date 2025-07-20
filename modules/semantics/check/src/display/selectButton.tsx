import React from "react";
import {GetterSetter} from "@lenscape/context";

type SelectButtonProps = {
    ops: GetterSetter<string>;
    text: string;
};
export const SelectButton: React.FC<SelectButtonProps> = ({ops, text}) => {
    const [value, set] = ops;
    const isSelected = value === text;

    return (
        <button
            onClick={() => set(text)}
            style={{
                marginRight: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: isSelected ? '#007bff' : '#eee',
                color: isSelected ? '#fff' : '#000',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
            }}
        >
            {text}
        </button>
    );
};