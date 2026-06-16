import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, TextField, InputAdornment, Button, Card, useTheme, useMediaQuery, TablePagination, Typography, Stack, Divider, Checkbox } from '@mui/material';
import { Search, Download } from '@mui/icons-material';
import * as XLSX from 'xlsx';

export default function DataTable({
  rows = [],
  columns = [],
  loading = false,
  pageSize = 10,
  rowsPerPageOptions = [5, 10, 20, 50],
  searchPlaceholder = 'Search...',
  searchField = 'name',
  enableExport = true,
  exportFilename = 'export.csv',
  onRowClick,
  checkboxSelection = false,
  onSelectionModelChange,
  selectionModel,
  ...props
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchText, setSearchText] = useState('');
  
  // Controlled pagination state to sync between mobile and desktop views
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  // Handle local searching
  const rowsArray = Array.isArray(rows) ? rows : [];
  const filteredRows = rowsArray.filter((row) => {
    if (!searchText) return true;
    
    // If searchField is a single key, search that
    if (typeof searchField === 'string') {
      const val = row[searchField];
      return String(val || '').toLowerCase().includes(searchText.toLowerCase());
    }
    
    // If searchField is an array, search any of those keys
    if (Array.isArray(searchField)) {
      return searchField.some((field) => {
        const val = row[field];
        return String(val || '').toLowerCase().includes(searchText.toLowerCase());
      });
    }

    // Fallback: search all top-level keys
    return Object.values(row).some((val) => 
      String(val || '').toLowerCase().includes(searchText.toLowerCase())
    );
  });

  // Export to Excel helper
  const handleExportExcel = () => {
    if (filteredRows.length === 0) return;

    // Filter columns to only visible/exportable ones
    const exportCols = columns.filter((col) => col.field && col.field !== '__check__' && col.headerName);
    
    // Format data for sheet
    const data = filteredRows.map((row) => {
      const rowData = {};
      exportCols.forEach((col) => {
        let val = row[col.field];
        if (col.valueGetter && typeof col.valueGetter === 'function') {
          val = col.valueGetter({ row });
        }
        rowData[col.headerName] = val === null || val === undefined ? '' : val;
      });
      return rowData;
    });

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Generate filename (replace .csv with .xlsx)
    const filename = exportFilename.replace(/\.csv$/i, '') + '.xlsx';

    // Write workbook to file
    XLSX.writeFile(workbook, filename);
  };

  // Mobile paginated rows calculation
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  return (
    <Card
      sx={{
        borderRadius: '16px',
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
          : '0 8px 32px rgba(108, 99, 255, 0.08)',
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        background: theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPage(0); // Reset page to 0 on search
          }}
          sx={{
            width: { xs: '100%', sm: 300 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        {enableExport && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={handleExportExcel}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              px: 2,
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'rgba(108, 99, 255, 0.04)',
              },
            }}
          >
            Export Excel
          </Button>
        )}
      </Box>

      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
          {paginatedRows.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
              No records found.
            </Box>
          ) : (
            paginatedRows.map((row, idx) => {
              const rowId = row.id || idx;
              const isSelected = selectionModel?.includes(rowId);
              
              // Find the actions column if it exists
              const actionCol = columns.find(
                (col) => col.field === 'actions' || col.field === 'action' || col.headerName?.toLowerCase() === 'actions'
              );
              
              // Other visible columns to render
              const displayCols = columns.filter(
                (col) => col.field !== 'actions' && col.field !== 'action' && col.field !== '__check__' && col.headerName
              );

              return (
                <Card
                  key={rowId}
                  onClick={() => onRowClick && onRowClick({ row })}
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    background: theme.palette.mode === 'dark' 
                      ? 'rgba(30, 30, 56, 0.4)' 
                      : 'rgba(248, 250, 255, 0.6)',
                    backdropFilter: 'blur(10px)',
                    position: 'relative',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 4px 20px rgba(0, 0, 0, 0.2)' 
                        : '0 4px 20px rgba(108, 99, 255, 0.05)',
                    }
                  }}
                >
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {checkboxSelection && (
                          <Checkbox
                            checked={isSelected || false}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              if (onSelectionModelChange) {
                                const newSelection = isSelected
                                  ? selectionModel.filter((id) => id !== rowId)
                                  : [...(selectionModel || []), rowId];
                                onSelectionModelChange(newSelection);
                              }
                            }}
                            size="small"
                          />
                        )}
                        {displayCols.length > 0 && (
                          <Box>
                            {(() => {
                              const firstCol = displayCols[0];
                              const val = row[firstCol.field];
                              if (firstCol.renderCell) {
                                return firstCol.renderCell({ row, value: val, field: firstCol.field });
                              }
                              if (firstCol.valueGetter) {
                                return (
                                  <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                    {firstCol.valueGetter({ row, value: val })}
                                  </Typography>
                                );
                              }
                              return (
                                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                  {val}
                                </Typography>
                              );
                            })()}
                          </Box>
                        )}
                      </Box>

                      {actionCol && (
                        <Box onClick={(e) => e.stopPropagation()}>
                          {actionCol.renderCell
                            ? actionCol.renderCell({ row, value: row[actionCol.field], field: actionCol.field })
                            : row[actionCol.field]}
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ opacity: 0.6 }} />

                    <Stack spacing={1}>
                      {displayCols.slice(1).map((col) => {
                        const val = row[col.field];
                        let renderedVal = null;
                        
                        if (col.renderCell) {
                          renderedVal = col.renderCell({ row, value: val, field: col.field });
                        } else if (col.valueGetter) {
                          renderedVal = col.valueGetter({ row, value: val });
                        } else {
                          renderedVal = val;
                        }

                        if (renderedVal === null || renderedVal === undefined || renderedVal === '') {
                          return null;
                        }

                        return (
                          <Box
                            key={col.field}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.825rem',
                              gap: 1
                            }}
                          >
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              {col.headerName}
                            </Typography>
                            <Box sx={{ textAlign: 'right', color: 'text.primary', fontSize: '0.85rem' }}>
                              {renderedVal}
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Stack>
                </Card>
              );
            })
          )}

          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={rowsPerPageOptions}
            sx={{
              alignSelf: 'center',
              borderTop: `1px solid ${theme.palette.divider}`,
              width: '100%',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.75rem',
              }
            }}
          />
        </Box>
      ) : (
        <Box sx={{ width: '100%', height: 500 }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            paginationModel={{ page, pageSize: rowsPerPage }}
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setRowsPerPage(model.pageSize);
            }}
            pageSizeOptions={rowsPerPageOptions}
            onRowClick={onRowClick}
            checkboxSelection={checkboxSelection}
            rowSelectionModel={selectionModel}
            onRowSelectionModelChange={onSelectionModelChange}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: theme.palette.mode === 'dark' ? '#1E1E38' : '#F8FAFF',
                color: 'text.primary',
                fontWeight: 700,
                borderBottom: `1px solid ${theme.palette.divider}`,
              },
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: `1px solid ${theme.palette.divider}`,
              },
              '& .MuiDataGrid-row:hover': {
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.02)' 
                  : 'rgba(108, 99, 255, 0.02)',
                cursor: onRowClick ? 'pointer' : 'default',
              },
            }}
            {...props}
          />
        </Box>
      )}
    </Card>
  );
}
