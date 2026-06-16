import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import { SmartToy, FileUpload, ContentCopy, AutoAwesome, Check } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { aiApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

export default function AISummaryPage() {
  const { accessToken } = useAuth();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0); // 0: Paste Text, 1: File Upload
  
  // Paste text state
  const [lectureText, setLectureText] = useState('');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Options
  const [summaryFormat, setSummaryFormat] = useState('bullet-points'); // detailed, bullet-points, checklist
  
  // Output states
  const [loading, setLoading] = useState(false);
  const [summaryOutput, setSummaryOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setSummaryOutput('');
    setCopied(false);
    
    try {
      setAuthHeader(accessToken);
      let res;
      
      if (activeTab === 0) {
        if (!lectureText.trim()) {
          toast.error('Please enter lecture transcript text');
          setLoading(false);
          return;
        }
        res = await aiApi.generateSummary(lectureText, summaryFormat);
      } else {
        if (!selectedFile) {
          toast.error('Please select a transcript file');
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('format', summaryFormat);
        res = await aiApi.generateSummaryFromFile(formData);
      }
      
      setSummaryOutput(res.data.data?.summary || res.data.message || 'AI summary generated successfully.');
      toast.success('Summary generated!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to generate AI summary');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryOutput);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box>
      <PageHeader
        title="AI Lecture Summarizer"
        subtitle="Harness artificial intelligence to extract study guides, summaries, and check-lists from lectures"
      />

      <Grid container spacing={4}>
        {/* Configurations Column */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              borderRadius: '16px',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                : '0 8px 32px rgba(108, 99, 255, 0.05)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToy color="primary" /> Transcript Settings
              </Typography>

              <Tabs
                value={activeTab}
                onChange={(e, val) => setActiveTab(val)}
                sx={{
                  mb: 3,
                  borderBottom: 1,
                  borderColor: 'divider',
                  '& .MuiTabs-indicator': {
                    background: 'linear-gradient(90deg, #6C63FF, #3F51B5)',
                  },
                }}
              >
                <Tab label="Paste Text" sx={{ textTransform: 'none', fontWeight: 600 }} />
                <Tab label="Upload File" sx={{ textTransform: 'none', fontWeight: 600 }} />
              </Tabs>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  {activeTab === 0 ? (
                    <TextField
                      label="Lecture Transcript / Content"
                      multiline
                      rows={8}
                      placeholder="Paste your lecture notes or transcripts here (minimum 50 words)..."
                      value={lectureText}
                      onChange={(e) => setLectureText(e.target.value)}
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  ) : (
                    <Card
                      variant="outlined"
                      sx={{
                        borderStyle: 'dashed',
                        borderRadius: '12px',
                        textAlign: 'center',
                        p: 4,
                        bgcolor: 'action.hover',
                      }}
                    >
                      <input
                        accept=".txt,.pdf,.doc,.docx"
                        style={{ display: 'none' }}
                        id="transcript-file"
                        type="file"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="transcript-file">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<FileUpload />}
                          sx={{ borderRadius: '8px', textTransform: 'none', mb: 2 }}
                        >
                          Select Document
                        </Button>
                      </label>
                      <Typography variant="body2" color="text.secondary">
                        {selectedFile ? `Selected: ${selectedFile.name}` : 'Supports TXT, PDF, DOCX (Max 10MB)'}
                      </Typography>
                    </Card>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="ai-format-label">Summary Format</InputLabel>
                    <Select
                      labelId="ai-format-label"
                      value={summaryFormat}
                      label="Summary Format"
                      onChange={(e) => setSummaryFormat(e.target.value)}
                      sx={{ borderRadius: '10px' }}
                    >
                      <MenuItem value="detailed">Detailed Narrative</MenuItem>
                      <MenuItem value="bullet-points">Key Bullet Points</MenuItem>
                      <MenuItem value="checklist">Study Guide Checklist</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={handleGenerate}
                    fullWidth
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
                    sx={{
                      borderRadius: '10px',
                      py: 1.5,
                      background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                      boxShadow: '0 4px 15px rgba(108, 99, 255, 0.3)',
                    }}
                  >
                    Generate Summary
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Output Column */}
        <Grid item xs={12} md={7}>
          <Card
            sx={{
              borderRadius: '16px',
              border: '1px solid',
              borderColor: 'divider',
              minHeight: 450,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Generated Summary</Typography>
              {summaryOutput && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={copied ? <Check /> : <ContentCopy />}
                  onClick={handleCopy}
                  sx={{ borderRadius: '8px', textTransform: 'none' }}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              )}
            </Box>
            
            <Divider />

            <Box sx={{ flex: 1, p: 3, bgcolor: theme.palette.mode === 'dark' ? '#0F0F23' : '#FDFDFF', display: 'flex', alignItems: loading ? 'center' : 'stretch', justifyContent: loading ? 'center' : 'stretch' }}>
              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={48} />
                  <Typography variant="body2" color="text.secondary">
                    AI is parsing and summarizing content...
                  </Typography>
                </Box>
              ) : summaryOutput ? (
                <Paper
                  elevation={0}
                  sx={{
                    width: '100%',
                    p: 2,
                    bgcolor: 'transparent',
                    fontFamily: 'Inter, sans-serif',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.7,
                    fontSize: '0.95rem',
                  }}
                >
                  {summaryOutput}
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', color: 'text.secondary' }}>
                  <AutoAwesome sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
                  <Typography variant="body2">
                    Enter transcript details and run the generator to see AI outputs.
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
