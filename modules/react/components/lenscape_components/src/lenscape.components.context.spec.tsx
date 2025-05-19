import {render, screen} from '@testing-library/react';
import {SimpleLoadingOrError} from './simple.loading.or.error';
import {defaultLenscapeComponents, LenscapeComponentsProvider, useLenscapeComponents} from "./lenscape.components.context";

describe('LenscapeComponentsProvider default', () => {
    it('provides SimpleLoadingOrError as LoadingOrError', () => {
        // Spy component that just renders "true" or "false"
        const Spy = () => {
            const {LoadingOrError} = useLenscapeComponents();
            const isDefault = LoadingOrError === SimpleLoadingOrError;
            return <span data-testid="loadingorerror">{String(isDefault)}</span>;
        };

        render(<Spy/>);

        expect(screen.getByTestId('loadingorerror')).toHaveTextContent('true');
    });
});
