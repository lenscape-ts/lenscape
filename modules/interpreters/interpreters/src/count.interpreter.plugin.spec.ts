import {CountInterpreterPlugin} from "./count.interpreter.plugin";

describe('CountInterpreterPlugin', () => {

    it('should execute correctly', async () => {
        const result = await CountInterpreterPlugin.execute([1, 2, 3] as any, 88);
        expect(result).toEqual({value:3});
    });
})