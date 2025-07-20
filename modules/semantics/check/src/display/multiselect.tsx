import React from 'react';
import {GetterSetter} from "@lenscape/context";

export interface MultiSelectProps {
    options: string[];
    selectedState: GetterSetter<string[]>;
}

export function MultiSelect({ options, selectedState }: MultiSelectProps) {
    const [selected, setSelected] = selectedState;

    const toggleOption = (option: string) => {
        setSelected(prev =>
            prev.includes(option)
                ? prev.filter(o => o !== option)
                : [...prev, option]
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {options.map(option => (
                <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                        type="checkbox"
                        checked={selected.includes(option)}
                        onChange={() => toggleOption(option)}
                    />
                    {option}
                </label>
            ))}
        </div>
    );
}
