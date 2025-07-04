import {fixedSelector, FixedSelector} from "./fixed.selector";


describe('fixedSelector', () => {

    test('execute returns the fixed selected value', async () => {
        const selector: FixedSelector = {
            type: 'fixed',
            select: 'billingAgent'
        };

        const result = await fixedSelector.execute(selector, {}, []);
        expect(result).toEqual({
            value: 'billingAgent',
            log: {
                whatHappened: 'fixed.select',
                params: 'billingAgent'
            }
        });
    });

    test('execute correctly returns different fixed values', async () => {
        const selector: FixedSelector = {
            type: 'fixed',
            select: 'technicalSupportAgent'
        };

        const result = await fixedSelector.execute(selector, {}, []);
        expect(result).toEqual({
            value: 'technicalSupportAgent',
            log: {
                whatHappened: 'fixed.select',
                params: 'technicalSupportAgent'
            }
        });
    });

    test('execute ignores optional description field', async () => {
        const selector: FixedSelector = {
            type: 'fixed',
            select: 'accountAgent',
            description: 'Always picks the account agent'
        };

        const result = await fixedSelector.execute(selector, {}, []);
        expect(result).toEqual({
            value: 'accountAgent',
            log: {
                whatHappened: 'fixed.select',
                params: 'accountAgent'
            }
        });
    });

});
