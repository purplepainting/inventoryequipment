import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import { theme } from './theme';
import Layout from './components/Layout';
import InventoryList from './modules/inventory/pages/InventoryList';

function TestPage() {
  return (
    <Box sx={{ p: 3, backgroundColor: 'purple', color: 'white' }}>
      <Typography variant="h4">LAYOUT TEST</Typography>
      <Typography variant="body1">If you can see this purple background with a sidebar, the Layout is working!</Typography>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<TestPage />} />
            <Route path="/inventory/list" element={<InventoryList />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App; 