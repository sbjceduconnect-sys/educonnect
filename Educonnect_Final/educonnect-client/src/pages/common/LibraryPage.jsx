import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
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
  CircularProgress,
  Stack,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
} from '@mui/material';
import { Search, Add, Delete, Edit, Book, AssignmentInd, KeyboardReturn, History } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { libraryApi, userApi } from '../../api';
import { setAuthHeader } from '../../api/axiosInstance';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

const CATEGORIES = ['Reference', 'Textbook', 'Science', 'Commerce', 'Arts', 'Fiction', 'Biography'];

const formatLibraryDate = (dateVal) => {
  if (!dateVal) return '';
  const date = new Date(dateVal._seconds ? dateVal._seconds * 1000 : dateVal);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function LibraryPage() {
  const { user, accessToken } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [books, setBooks] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab View state
  const [activeTab, setActiveTab] = useState(0);
  
  // Search and filter catalog state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Dialog states
  const [openBookDialog, setOpenBookDialog] = useState(false);
  const [openIssueDialog, setOpenIssueDialog] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedTxn, setSelectedTxn] = useState(null);

  // Forms states
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Reference',
    publisher: '',
    shelfLocation: '',
    totalCopies: 1,
  });

  const [issueForm, setIssueForm] = useState({
    bookId: '',
    userId: '',
  });

  const [returnDetails, setReturnDetails] = useState({
    fine: 0,
  });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      setAuthHeader(accessToken);
      
      const bookRes = await libraryApi.listBooks();
      setBooks(bookRes.data.data || []);

      if (isAdmin) {
        const [txnRes, userRes] = await Promise.all([
          libraryApi.listTransactions(),
          userApi.listUsers({ isApproved: 'true' }),
        ]);
        setTransactions(txnRes.data.data || []);
        setUsersList(userRes.data.data || []);
      } else {
        const borrowRes = await libraryApi.getMyBooks();
        setBorrowedBooks(borrowRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve library data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchData();
    }
  }, [accessToken]);

  const handleOpenAddBook = () => {
    setSelectedBook(null);
    setBookForm({
      title: '',
      author: '',
      isbn: '',
      category: 'Reference',
      publisher: '',
      shelfLocation: '',
      totalCopies: 1,
    });
    setOpenBookDialog(true);
  };

  const handleEditBookClick = (book) => {
    setSelectedBook(book);
    setBookForm({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      category: book.category || 'Reference',
      publisher: book.publisher || '',
      shelfLocation: book.shelfLocation || '',
      totalCopies: book.totalCopies || 1,
    });
    setOpenBookDialog(true);
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    if (!bookForm.title || !bookForm.author || !bookForm.isbn) {
      toast.error('Title, author and ISBN are required');
      return;
    }

    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      const payload = {
        ...bookForm,
        totalCopies: parseInt(bookForm.totalCopies, 10),
        availableCopies: selectedBook 
          ? selectedBook.availableCopies + (parseInt(bookForm.totalCopies, 10) - selectedBook.totalCopies)
          : parseInt(bookForm.totalCopies, 10),
      };

      if (selectedBook) {
        await libraryApi.updateBook(selectedBook.id, payload);
        toast.success('Book updated successfully');
      } else {
        await libraryApi.createBook(payload);
        toast.success('Book added successfully');
      }

      setOpenBookDialog(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save book');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBookTrigger = (book) => {
    setSelectedBook(book);
    setDeleteOpen(true);
  };

  const handleDeleteBookConfirm = async () => {
    if (!selectedBook) return;
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await libraryApi.deleteBook(selectedBook.id);
      toast.success('Book deleted successfully');
      setDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete book');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenIssue = () => {
    setIssueForm({
      bookId: books[0]?.id || '',
      userId: usersList[0]?.id || '',
    });
    setOpenIssueDialog(true);
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueForm.bookId || !issueForm.userId) {
      toast.error('Book and user selection are required');
      return;
    }

    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await libraryApi.issueBook(issueForm);
      toast.success('Book issued successfully');
      setOpenIssueDialog(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue book');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnTrigger = async (txn) => {
    setSelectedTxn(txn);
    
    // Estimate fine
    const returnDate = new Date();
    let fine = 0;
    const dueDate = txn.dueDate?._seconds ? new Date(txn.dueDate._seconds * 1000) : new Date(txn.dueDate);
    if (returnDate > dueDate) {
      const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      fine = daysLate * 5; // ₹5 per day
    }
    setReturnDetails({ fine });
    setOpenReturnDialog(true);
  };

  const handleReturnConfirm = async () => {
    if (!selectedTxn) return;
    setActionLoading(true);
    try {
      setAuthHeader(accessToken);
      await libraryApi.returnBook(selectedTxn.id);
      toast.success(`Book returned. Settle fine of ₹${returnDetails.fine}`);
      setOpenReturnDialog(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to complete book return');
    } finally {
      setActionLoading(false);
    }
  };

  const getBookTitle = (id) => {
    const b = books.find((x) => x.id === id);
    return b ? `${b.title} by ${b.author}` : 'Unknown Book';
  };

  const getUserDetails = (id) => {
    const u = usersList.find((x) => x.id === id);
    return u ? `${u.firstName} ${u.lastName} (${u.email})` : 'Unknown User';
  };

  // Filter local books for catalog search
  const filteredBooks = books.filter((book) => {
    const matchesSearch = 
      book.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn?.includes(searchQuery);
    
    const matchesCategory = selectedCategory === '' || book.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <Box>
      <PageHeader
        title="College Library"
        subtitle="Manage inventory, search academic publications, and issue borrowed books"
        action={isAdmin ? handleOpenAddBook : null}
        actionLabel="Add Book"
        actionIcon={<Add />}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 15 }}>
          <CircularProgress size={45} />
        </Box>
      ) : (
        <Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
              <Tab label="Book Catalog" icon={<Book />} iconPosition="start" sx={{ fontWeight: 700 }} />
              {!isAdmin && <Tab label="My Borrowed Books" icon={<History />} iconPosition="start" sx={{ fontWeight: 700 }} />}
              {isAdmin && <Tab label="Issue / Returns console" icon={<AssignmentInd />} iconPosition="start" sx={{ fontWeight: 700 }} />}
              {isAdmin && <Tab label="Transactions Log" icon={<History />} iconPosition="start" sx={{ fontWeight: 700 }} />}
            </Tabs>
          </Box>

          {/* Book Catalog Tab */}
          {activeTab === 0 && (
            <Box>
              {/* Search filters */}
              <Card sx={{ p: 2.5, mb: 4, borderRadius: '15px', border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      placeholder="Search books by title, author, or ISBN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel id="category-filter-label">Filter Category</InputLabel>
                      <Select
                        labelId="category-filter-label"
                        value={selectedCategory}
                        label="Filter Category"
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        sx={{ borderRadius: '10px' }}
                      >
                        <MenuItem value="">All Categories</MenuItem>
                        {CATEGORIES.map((cat) => (
                          <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Card>

              {/* Catalog Cards */}
              <Grid container spacing={3}>
                {filteredBooks.length === 0 ? (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '15px' }}>
                      <Typography variant="body1" color="text.secondary">No books match your criteria.</Typography>
                    </Paper>
                  </Grid>
                ) : (
                  filteredBooks.map((book) => {
                    const isAvailable = (book.availableCopies || 0) > 0;
                    return (
                      <Grid item xs={12} sm={6} md={4} key={book.id}>
                        <Card
                          sx={{
                            borderRadius: '20px',
                            border: '1px solid',
                            borderColor: 'divider',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            '&:hover': {
                              boxShadow: '0 8px 30px rgba(108, 99, 255, 0.08)',
                              transform: 'translateY(-2px)',
                              transition: 'all 0.3s ease',
                            },
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                              <Chip
                                label={book.category}
                                size="small"
                                color="secondary"
                                sx={{ borderRadius: '6px', fontWeight: 600 }}
                              />
                              <Chip
                                label={isAvailable ? 'Available' : 'Out of Stock'}
                                size="small"
                                color={isAvailable ? 'success' : 'error'}
                                sx={{ borderRadius: '6px', fontWeight: 700 }}
                              />
                            </Stack>

                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                              {book.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              by <strong>{book.author}</strong>
                            </Typography>

                            <Stack spacing={1} sx={{ mt: 2 }}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                ISBN: <strong>{book.isbn}</strong>
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Publisher: <strong>{book.publisher || 'N/A'}</strong>
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Shelf Location: <strong>{book.shelfLocation || 'N/A'}</strong>
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Copies: <strong>{book.availableCopies || 0} / {book.totalCopies || 0}</strong>
                              </Typography>
                            </Stack>
                          </CardContent>

                          {isAdmin && (
                            <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <IconButton color="primary" onClick={() => handleEditBookClick(book)}>
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton color="error" onClick={() => handleDeleteBookTrigger(book)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </Card>
                      </Grid>
                    );
                  })
                )}
              </Grid>
            </Box>
          )}

          {/* Student/Teacher Borrowed Books */}
          {!isAdmin && activeTab === 1 && (
            <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', p: 3 }}>
              {borrowedBooks.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    You currently have no issued library books.
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <Paper component="th" sx={{ border: 'none', background: 'none' }}></Paper>
                        <TableCell sx={{ fontWeight: 700 }}>Book Title / Author</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Issue Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Fine</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {borrowedBooks.map((txn) => {
                        const issueDateStr = formatLibraryDate(txn.issueDate);
                        const dueDateStr = formatLibraryDate(txn.dueDate);
                        return (
                          <TableRow key={txn.id}>
                            <TableCell></TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{getBookTitle(txn.bookId)}</TableCell>
                            <TableCell>{issueDateStr}</TableCell>
                            <TableCell>{dueDateStr}</TableCell>
                            <TableCell>
                              <Typography color={txn.fine > 0 ? 'error' : 'text.primary'} sx={{ fontWeight: 700 }}>
                                ₹{txn.fine || 0}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={txn.status} color="warning" size="small" sx={{ borderRadius: '6px', fontWeight: 600, textTransform: 'capitalize' }} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          )}

          {/* Admin Issues/Returns Console */}
          {isAdmin && activeTab === 1 && (
            <Grid container spacing={4}>
              {/* Quick Issue Form */}
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Issue Book</Typography>
                  <form onSubmit={handleIssueSubmit}>
                    <Stack spacing={3}>
                      <FormControl fullWidth required>
                        <InputLabel id="issue-book-label">Select Book</InputLabel>
                        <Select
                          labelId="issue-book-label"
                          value={issueForm.bookId}
                          label="Select Book"
                          onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
                        >
                          {books.filter(b => b.availableCopies > 0).map((b) => (
                            <MenuItem key={b.id} value={b.id}>{b.title} ({b.availableCopies} available)</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth required>
                        <InputLabel id="issue-user-label">Select Borrower</InputLabel>
                        <Select
                          labelId="issue-user-label"
                          value={issueForm.userId}
                          label="Select Borrower"
                          onChange={(e) => setIssueForm({ ...issueForm, userId: e.target.value })}
                        >
                          {usersList.map((u) => (
                            <MenuItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Button
                        type="submit"
                        variant="contained"
                        disabled={actionLoading}
                        fullWidth
                        sx={{
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                          py: 1.2,
                        }}
                      >
                        Confirm Book Issue
                      </Button>
                    </Stack>
                  </form>
                </Card>
              </Grid>

              {/* Active Issues table */}
              <Grid item xs={12} md={8}>
                <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2.5 }}>Active Issues</Typography>
                  
                  {transactions.filter(t => t.status === 'issued').length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">No books are currently issued.</Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Borrower</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Book Title</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {transactions.filter(t => t.status === 'issued').map((txn) => {
                            const dueDateStr = formatLibraryDate(txn.dueDate);
                            return (
                              <TableRow key={txn.id}>
                                <TableCell sx={{ fontWeight: 600 }}>{getUserDetails(txn.userId)}</TableCell>
                                <TableCell>{getBookTitle(txn.bookId)}</TableCell>
                                <TableCell>{dueDateStr}</TableCell>
                                <TableCell align="center">
                                  <Button
                                    variant="outlined"
                                    color="secondary"
                                    size="small"
                                    startIcon={<KeyboardReturn />}
                                    onClick={() => handleReturnTrigger(txn)}
                                    sx={{ borderRadius: '8px' }}
                                  >
                                    Return
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Admin Transactions Log */}
          {isAdmin && activeTab === 2 && (
            <Card sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2.5 }}>Historical Borrow Logs</Typography>

              {transactions.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No transactions recorded.</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Borrower</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Book Title</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Issue Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Return Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Fine Settle</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((txn) => {
                        const issueDateStr = formatLibraryDate(txn.issueDate);
                        const returnDateStr = formatLibraryDate(txn.returnDate) || '—';
                        return (
                          <TableRow key={txn.id}>
                            <TableCell sx={{ fontWeight: 600 }}>{getUserDetails(txn.userId)}</TableCell>
                            <TableCell>{getBookTitle(txn.bookId)}</TableCell>
                            <TableCell>{issueDateStr}</TableCell>
                            <TableCell>{returnDateStr}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: txn.fine > 0 ? 'error.main' : 'text.primary' }}>
                              ₹{txn.fine || 0}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={txn.status}
                                size="small"
                                color={txn.status === 'returned' ? 'success' : 'warning'}
                                sx={{ borderRadius: '6px', fontWeight: 600, textTransform: 'capitalize' }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          )}
        </Box>
      )}

      {/* Add / Edit Book Dialog */}
      <Dialog
        open={openBookDialog}
        onClose={() => setOpenBookDialog(false)}
        maxWidth="xs"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '24px' } }}
      >
        <form onSubmit={handleSaveBook}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {selectedBook ? 'Edit Book Details' : 'Add Book to Inventory'}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: 3 }}>
            <TextField
              label="Book Title"
              value={bookForm.title}
              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              label="Author"
              value={bookForm.author}
              onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              label="ISBN Code"
              value={bookForm.isbn}
              onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <FormControl fullWidth required>
              <InputLabel id="book-category-label">Category</InputLabel>
              <Select
                labelId="book-category-label"
                value={bookForm.category}
                label="Category"
                onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                sx={{ borderRadius: '10px' }}
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Publisher"
              value={bookForm.publisher}
              onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              label="Shelf Location (e.g. Rack A-3)"
              value={bookForm.shelfLocation}
              onChange={(e) => setBookForm({ ...bookForm, shelfLocation: e.target.value })}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              label="Total Copies"
              type="number"
              value={bookForm.totalCopies}
              onChange={(e) => setBookForm({ ...bookForm, totalCopies: e.target.value })}
              required
              fullWidth
              InputProps={{ inputProps: { min: 1 } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenBookDialog(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={actionLoading}
              sx={{
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
                px: 3,
              }}
            >
              Save Book
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Settle Return & Fine Dialog */}
      <Dialog
        open={openReturnDialog}
        onClose={() => setOpenReturnDialog(false)}
        maxWidth="xs"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '24px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Settle Book Return</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="body1">
              You are about to register the return of the book:
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, pl: 1.5, borderLeft: '4px solid #6C63FF' }}>
              {selectedTxn && getBookTitle(selectedTxn.bookId)}
            </Typography>
            <Typography variant="body2">
              Borrower: <strong>{selectedTxn && getUserDetails(selectedTxn.userId)}</strong>
            </Typography>
            <Box sx={{ p: 2, borderRadius: '12px', bgcolor: returnDetails.fine > 0 ? 'error.light' : 'success.light', color: 'white', mt: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {returnDetails.fine > 0 ? 'Overdue Fine Due:' : 'Status: On Time'}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                ₹{returnDetails.fine}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenReturnDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={actionLoading}
            onClick={handleReturnConfirm}
            sx={{
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
              px: 3,
            }}
          >
            Confirm Return
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Book Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Remove Book from Inventory"
        message={`Are you sure you want to permanently delete the book "${selectedBook?.title}" from the library? This will delete its details and records.`}
        confirmLabel="Remove"
        confirmColor="error"
        loading={actionLoading}
        onConfirm={handleDeleteBookConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
