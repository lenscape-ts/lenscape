import {GetterSetter} from "@lenscape/context";
import React from "react";
import {KnnResult} from "./knn.search";

export type SimilarityAndIdProps = {
    results: KnnResult[]
    selected: GetterSetter<number>
    queryVec: number[]
}

export function SimiliarityAndIdList({results, selected}: SimilarityAndIdProps) {
    const [, setSelected] = selected;
    return <table>
        <thead>
        <tr>
            <th>Similarity</th>
            <th>ID</th>
        </tr>
        </thead>
        <tbody>
        {results.map((result, i) => (
            <tr key={i} onClick={() => setSelected(i)} style={{cursor: 'pointer', backgroundColor: i === selected[0] ? '#f0f0f0' : 'transparent'}}>
                <td>{result.similarity.toFixed(4)}</td>
                <td>{result.id}</td>
            </tr>
        ))}
        </tbody>
    </table>
}