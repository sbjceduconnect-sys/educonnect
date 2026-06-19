import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { Add, Delete, CloudDownload, UploadFile, Description, PictureAsPdf, Slideshow, Class } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { materialApi, courseApi, subjectApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionRationaleDialog from '../../components/common/PermissionRationaleDialog';
import { useAppPermissions } from '../../hooks/useAppPermissions';
import { downloadBlob } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function StudyMaterialsPage() {
  const { user, accessToken } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const { requestStoragePermission, isNative } = useAppPermissions();

  // If path is '/question-papers', we focus only on exam papers
  const isQuestionPapersView = location.pathname === '/question-papers';
  
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';
  const canUpload = isTeacher || isAdmin;

  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload/Form Dialogs
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    subjectId: '',
    type: 'pdf', // pdf, note, ppt, video, question_paper
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Storage permission rationale dialog state
  // pendingStorageAction holds the action (upload/download) to run after permission
  const [storageRationaleOpen, setStorageRationaleOpen] = useState(false);
  const [pendingStorageAction, setPendingStorageAction] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      // Construct params
      const params = {};
      if (isQuestionPapersView) {
        params.type = 'question_paper';
      }

      const [materialRes, courseRes, subjectRes] = await Promise.all([
        materialApi.list(params),
        courseApi.list(),
        subjectApi.list(),
      ]);

      setMaterials(materialRes.data.data || []);
      setCourses(courseRes.data.data || []);
      setSubjects(subjectRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load study materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken, location.pathname]);

  // ── Storage permission gating ─────────────────────────────────────────────
  /**
   * Called after user confirms the storage rationale dialog.
   * Requests native storage permission, then runs the pending action
   * (upload dialog open, or download) if granted.
   */
  const handleStorageRationaleConfirm = async () => {
    setStorageRationaleOpen(false);
    setTimeout(async () => {
      const granted = await requestStoragePermission();
      if (granted) {
        if (pendingStorageAction) {
          pendingStorageAction();
          setPendingStorageAction(null);
        }
      } else {
        toast.error(
          'Storage permission denied. Please enable it in Device Settings → Apps → EduConnect → Permissions.',
          { duration: 5000 }
        );
      }
    }, 200);
  };

  /**
   * Gated upload dialog opener.
   * On native: shows rationale dialog first.
   * On web: opens dialog directly.
   */
  const handleOpenCreate = () => {
    const openUploadDialog = () => {
      setSelectedMaterial(null);
      setUploadFile(null);
      setFormData({
        title: '',
        description: '',
        courseId: '',
        subjectId: '',
        type: isQuestionPapersView ? 'question_paper' : 'pdf',
      });
      setOpenDialog(true);
    };

    if (isNative) {
      setPendingStorageAction(() => openUploadDialog);
      setStorageRationaleOpen(true);
    } else {
      openUploadDialog();
    }
  };

  const handleDeleteTrigger = (material) => {
    setSelectedMaterial(material);
    setDeleteOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  // Submit Upload Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }
    setActionLoading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('material', uploadFile);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('courseId', formData.courseId);
      uploadData.append('subjectId', formData.subjectId);
      uploadData.append('type', formData.type);

      setAuthHeader(accessToken);
      await materialApi.create(uploadData);
      
      toast.success('Material uploaded successfully!');
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload material');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Gated download handler.
   * On native: shows rationale dialog first, then downloads.
   * On web: downloads directly (browser handles its own permissions).
   */
  const handleDownload = async (material) => {
    const doDownload = async () => {
      try {
        setAuthHeader(accessToken);
        const res = await materialApi.download(material.id);
        const fileExt = material.file ? material.file.split('.').pop().split('?')[0].toLowerCase() : 'pdf';
        const filename = material.originalName || `${material.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExt}`;
        downloadBlob(res.data, filename);
        toast.success('Download started!');
      } catch (err) {
        toast.error('Failed to download file');
      }
    };

    if (isNative) {
      setPendingStorageAction(() => doDownload);
      setStorageRationaleOpen(true);
    } else {
      await doDownload();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMaterial) return;
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await materialApi.delete(selectedMaterial.id);
      toast.success('Material deleted successfully');
      setDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete material');
    } finally {
      setActionLoading(false);
    }
  };

  const getSubjectName = (subjId) => {
    const s = subjects.find((subj) => subj.id === subjId);
    return s ? s.name : 'General';
  };

  const getFileIcon = (type) => {
    if (type === 'pdf') return <PictureAsPdf sx={{ fontSize: 36, color: '#F44336' }} />;
    if (type === 'ppt') return <Slideshow sx={{ fontSize: 36, color: '#FF9800' }} />;
    if (type === 'video') return <Slideshow sx={{ fontSize: 36, color: '#4CAF50' }} />;
    if (type === 'question_paper') return <Description sx={{ fontSize: 36, color: '#E91E63' }} />;
    return <Description sx={{ fontSize: 36, color: '#2196F3' }} />;
  };

  const displayMaterials = isQuestionPapersView
    ? materials.filter((item) => item.type === 'question_paper')
    : materials.filter((item) => item.type !== 'question_paper');

  return (
    <Box>
      <PageHeader
        title={isQuestionPapersView ? 'Question Papers Hub' : 'Study Materials'}
        subtitle={isQuestionPapersView ? 'Access previous years examination question papers' : 'Browse notes, slides, and class files uploaded by teachers'}
        action={canUpload ? handleOpenCreate : null}
        actionLabel={isQuestionPapersView ? 'Upload Paper' : 'Upload Material'}
        actionIcon={<UploadFile />}
      />

      {/* Storage Permission Rationale Dialog — shown before native OS prompt */}
      <PermissionRationaleDialog
        open={storageRationaleOpen}
        permissionType="storage"
        onConfirm={handleStorageRationaleConfirm}
        onDismiss={() => {
          setStorageRationaleOpen(false);
          setPendingStorageAction(null);
        }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {displayMaterials.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
                <Typography color="text.secondary">No materials found.</Typography>
              </Card>
            </Grid>
          ) : (
            displayMaterials.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card
                  sx={{
                    borderRadius: '16px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 8px 32px rgba(108, 99, 255, 0.04)',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      {getFileIcon(item.type)}
                      <Chip label={item.type} size="small" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 800 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, lineHeight: 1.2 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {item.description || 'No description provided.'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                      <Chip icon={<Class sx={{ fontSize: '0.8rem' }} />} label={getSubjectName(item.subjectId)} size="small" variant="outlined" />
                    </Box>
                  </Box>

                  <Divider />
                  
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'action.hover' }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CloudDownload />}
                      onClick={() => handleDownload(item)}
                      sx={{ borderRadius: '8px', textTransform: 'none', background: 'linear-gradient(135deg, #6C63FF, #3F51B5)' }}
                    >
                      Download
                    </Button>
                    {canUpload && (
                      <IconButton color="error" onClick={() => handleDeleteTrigger(item)} size="small">
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>Upload Educational Resource</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Resource Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <FormControl fullWidth required>
              <InputLabel id="select-course-label">Select Course</InputLabel>
              <Select
                labelId="select-course-label"
                value={formData.courseId}
                label="Select Course"
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                sx={{ borderRadius: '10px' }}
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel id="select-subject-label">Subject</InputLabel>
              <Select
                labelId="select-subject-label"
                value={formData.subjectId}
                label="Subject"
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                sx={{ borderRadius: '10px' }}
              >
                {subjects.map((subj) => (
                  <MenuItem key={subj.id} value={subj.id}>
                    {subj.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel id="select-type-label">Resource Type</InputLabel>
              <Select
                labelId="select-type-label"
                value={formData.type}
                label="Resource Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="pdf">PDF Document</MenuItem>
                <MenuItem value="note">Study Note</MenuItem>
                <MenuItem value="ppt">Powerpoint Slides</MenuItem>
                <MenuItem value="video">Lecture Video</MenuItem>
                <MenuItem value="question_paper">Question Paper</MenuItem>
              </Select>
            </FormControl>

            <Card variant="outlined" sx={{ borderStyle: 'dashed', borderRadius: '12px', textAlign: 'center', p: 3, bgcolor: 'action.hover' }}>
              <input
                style={{ display: 'none' }}
                id="material-file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="material-file-upload">
                <Button variant="contained" component="span" startIcon={<UploadFile />} sx={{ borderRadius: '8px', mb: 1 }}>
                  Select File
                </Button>
              </label>
              <Typography variant="body2" color="text.secondary">
                {uploadFile ? `Selected: ${uploadFile.name}` : 'Choose PDF, PPT, MP4 or Document'}
              </Typography>
            </Card>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenDialog(false)} disabled={actionLoading}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={actionLoading}
              sx={{
                borderRadius: '10px',
                px: 3,
                background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
              }}
            >
              Upload Material
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Material"
        message={`Are you sure you want to delete "${selectedMaterial?.title}"?`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
