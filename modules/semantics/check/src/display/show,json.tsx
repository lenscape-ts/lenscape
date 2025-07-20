import React from "react";

export type ShowTextProps = {
    text: string
}

export function ShowText({text}: ShowTextProps) {
    return <pre style={{background: '#f5f5f5', padding: '1rem', borderRadius: '5px', overflowX: 'auto'}}>
                {text}
            </pre>

}
export type ShowJsonProps = {
    json: any
}

export function ShowJson({json}: ShowJsonProps) {
    return <ShowText text={JSON.stringify(json, null, 2)}/>
}
