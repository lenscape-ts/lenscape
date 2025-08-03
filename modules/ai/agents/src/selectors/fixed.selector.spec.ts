import {fixedSelector, FixedSelector} from "./fixed.selector";


describe('fixedSelector', () => {

    test('execute returns the fixed selected value', async () => {
        const selector: FixedSelector = {
            type: 'fixed',
            select: 'billingAgent'
        };

        const result = await fixedSelector.execute(selector, {}, []);
        expect(result).toEqual({
            "log": {
                "params": "billingAgent",
                "whatHappened": "fixed.select"
            },
            "value": {
                "context": {},
                "selected": "billingAgent"
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
            "log": {
                "params": "technicalSupportAgent",
                "whatHappened": "fixed.select"
            },
            "value": {
                "context": {},
                "selected": "technicalSupportAgent"
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
            "log": {
                "params": "accountAgent",
                "whatHappened": "fixed.select"
            },
            "value": {
                "context": {},
                "selected": "accountAgent"
            }
        });
    });

});
