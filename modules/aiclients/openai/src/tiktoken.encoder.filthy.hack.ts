//tiktoken is terribly written and only works in node easiily.
//it uses wasm, and didn't bother putting in the effort to use it properly
//this is a filthy hack to get it to work in the browser.

//Even with this hack we still need to sort out the parcelrc
let encoding_for_model_cached: ((model: string) => any) | null = null;

export type TikTokenEncoder = {
    encode: (text: string) => number[];
}
export type TikTokenEncoderFn = (model: string) => Promise<TikTokenEncoder>;
export async function getTikTokenEncoderRaw(model: string = "gpt-4"): Promise<TikTokenEncoder> {
    if (typeof window !== "undefined") {
        (globalThis as any).wasm_path = "/tiktoken_bg.wasm";
    }

    if (!encoding_for_model_cached) {
        const { encoding_for_model } = await import("tiktoken");
        encoding_for_model_cached = encoding_for_model;
    }

    return encoding_for_model_cached(model as any);
}
let encoderPromise: Promise<TikTokenEncoder> | null = null;

export function getTikTokenEncoder(model = "gpt-4"): Promise<TikTokenEncoder> {
    return encoderPromise ??= getTikTokenEncoderRaw(model);
}
