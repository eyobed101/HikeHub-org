import React, { useState } from 'react';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { styled } from '@mui/system';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
  '&.MuiTableCell-body': {
    color: theme.palette.text.primary,
  },
}));

const SingleMenuView: React.FC = () => {
  const [events, setEvents] = useState<any[]>([
    // Dummy data
    {
      _id: '1',
      title: 'Mountain Hiking',
      description: 'A wonderful mountain hike.',
      location: 'Everest Base Camp',
      startDate: '2024-06-10',
      endDate: '2024-06-15',
      price: 200,
      status: 'Pending',
    },
    {
      _id: '2',
      title: 'Camping Adventure',
      description: 'A 3-day camping trip.',
      location: 'Yellowstone Park',
      startDate: '2024-07-01',
      endDate: '2024-07-04',
      price: 150,
      status: 'Approved',
    },
  ]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    startDate: null,
    endDate: null,
    price: 0,
    status: 'Pending',
  });

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setNewEvent({
      title: '',
      description: '',
      location: '',
      startDate: null,
      endDate: null,
      price: 0,
      status: 'Pending',
    });
  };

  const handleAddEvent = () => {
    setEvents([...events, { ...newEvent, _id: `${events.length + 1}` }]);
    handleCloseModal();
  };

  const handleViewEvent = (eventId: string) => {
    const event = events.find((e) => e._id === eventId);
    setSelectedEvent(event);
  };

  const handleDeleteEvent = (eventId: string) => {
    const updatedEvents = events.filter((event) => event._id !== eventId);
    setEvents(updatedEvents);
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpenModal}
        sx={{ marginBottom: '20px' }}
      >
        Add New Event
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Title</StyledTableCell>
              <StyledTableCell>Description</StyledTableCell>
              <StyledTableCell>Location</StyledTableCell>
              <StyledTableCell>Start Date</StyledTableCell>
              <StyledTableCell>End Date</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell>Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event._id}>
                <TableCell>{event.title}</TableCell>
                <TableCell>{event.description}</TableCell>
                <TableCell>{event.location}</TableCell>
                <TableCell>{event.startDate}</TableCell>
                <TableCell>{event.endDate}</TableCell>
                <TableCell>{event.status}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleViewEvent(event._id)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="secondary"
                    onClick={() => handleDeleteEvent(event._id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Dialog
          open={Boolean(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
          fullWidth
        >
          <DialogTitle>{selectedEvent.title}</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              <strong>Description: </strong>
              {selectedEvent.description}
            </Typography>
            <Typography variant="body1">
              <strong>Location: </strong>
              {selectedEvent.location}
            </Typography>
            <Typography variant="body1">
              <strong>Start Date: </strong>
              {selectedEvent.startDate}
            </Typography>
            <Typography variant="body1">
              <strong>End Date: </strong>
              {selectedEvent.endDate}
            </Typography>
            <Typography variant="body1">
              <strong>Price: </strong>
              ${selectedEvent.price}
            </Typography>
            <Typography variant="body1">
              <strong>Status: </strong>
              {selectedEvent.status}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedEvent(null)} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Add Event Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} fullWidth>
        <DialogTitle>Add New Event</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Event Title"
                fullWidth
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Location"
                fullWidth
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="Start Date"
                value={newEvent.startDate}
                onChange={(newValue) => setNewEvent({ ...newEvent, startDate: newValue })}
                slots={{ textField: TextField }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="End Date"
                value={newEvent.endDate}
                onChange={(newValue) => setNewEvent({ ...newEvent, endDate: newValue })}
                slots={{ textField: TextField }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Price"
                type="number"
                fullWidth
                value={newEvent.price}
                onChange={(e) => setNewEvent({ ...newEvent, price: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newEvent.status}
                  onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleAddEvent} color="primary">
            Add Event
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SingleMenuView;
