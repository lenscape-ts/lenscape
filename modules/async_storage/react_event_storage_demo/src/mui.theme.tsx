// theme.ts
import {createTheme} from "@mui/material/styles";

export const defaultTheme = createTheme({
    palette: {
        primary: {
            main: '#1976d2', // Default primary color (blue)
        },
        secondary: {
            main: '#dc004e', // Default secondary color (pink)
        },
        background: {
            default: '#ffffff', // Default background color
            paper: '#ffffff', // Background color for components like Paper, Card, etc.
        },
    },
    components: {
        MuiAppBar: {
            defaultProps: {
                color: 'default', // Set AppBar to use 'default' palette color
            },
            styleOverrides: {
                root: {
                    backgroundColor: '#ffffff', // Override background color to white
                    borderBottom: '1px solid #ddd', // Add a subtle bottom border
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '20px', // Rounded corners for buttons
                },
            },
        },
    },
});

