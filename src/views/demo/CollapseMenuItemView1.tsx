import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardHeader,
  Button,
  Modal,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import Carousel from 'react-material-ui-carousel';
import axiosInstance from '../../config/axios';

import { FavoriteOutlined, Star, VisibilityRounded } from '@mui/icons-material';
type EventType = {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  location: string;
  startDate: string;
  endDate: string;
  rating: number;
  multimedia: string[];
  status: string;
  createdAt: string;
};

type EventCardProps = {
  event: EventType;
  onOpenModal: () => void;
};

const EventCard: React.FC<EventCardProps> = ({ event, onOpenModal }) => (
  <Card sx={{ marginBottom: 4, boxShadow: '0px 5px 10px rgba(0,0,0,0.15)', minWidth: '250px', maxWidth: '300px', marginX: '20px' }}>
    <img
      src={event.multimedia[0]}
      alt={event.title}
      style={{ width: '100%', height: 210, objectFit: 'cover' }}
    />
    <CardHeader title={event.title} subheader={event.location} />
    <Box px={3}>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {event.description}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {`${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}`}
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, mb: 2, mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Star sx={{ color: 'gray' }} />
        <Typography variant="body2" sx={{ ml: 1 }}>
          {event.rating}
        </Typography>
      </Box>
      <IconButton onClick={onOpenModal}>
        <VisibilityRounded color="primary" />
      </IconButton>
    </Box>
  </Card>
);

const CollapseMenuItemView1: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [data, setDataSource] = useState<EventType[]>([]);
  const [category, setCategory] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('Approved');
  const [refresh, setRefresh] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const fetchDataAndSetState = async () => {
      try {
        const [fetchedData, fetchedCat] = await Promise.all([
          axiosInstance.get('/v1.0/event/all').then(res => res.data),
          axiosInstance.get('/v1.0/category').then(res => res.data)
        ]);
        setDataSource(fetchedData);
        setCategory(fetchedCat);
      } catch (error) {
        setDataSource([]);
        setCategory([]);
      }
    };
    fetchDataAndSetState();
  }, [refresh]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value);

  const filteredData = data
    .filter(event =>
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.location.toLowerCase().includes(search.toLowerCase())
    )
    .filter(event => event.status === statusFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleOpenModal = (event: EventType) => {
    setSelectedEvent(event);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSelectedEvent(null);
  };

  return (
    <Box sx={{ padding: 0 }}>
      <Card sx={{ padding: 2, marginBottom: 2 }}>
        <CardHeader title="Event List" />
        <TextField
          size="small"
          value={search}
          placeholder="Search events"
          onChange={handleSearchChange}
          variant="outlined"
          sx={{ display: 'flex', padding: '25px', justifyContent: 'flex-end', width: '30vw' }}
          InputProps={{ startAdornment: <InputAdornment position="start" /> }}
        />
        <Grid container spacing={2} sx={{ marginTop: 4 }}>
          {filteredData.map(event => (
            <Grid item xs={12} sm={6} md={3} key={event.id}>
              <EventCard event={event} onOpenModal={() => handleOpenModal(event)} />
            </Grid>
          ))}
        </Grid>
      </Card>

      <Modal open={open} onClose={handleCloseModal} aria-labelledby="event-modal-title" aria-describedby="event-modal-description">
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxWidth: '800px',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          overflow: 'auto',
          maxHeight: '90vh',
        }}>
          {selectedEvent && (
            <>
              <Box sx={{ mb: 4 }}>
                <Carousel autoPlay infiniteLoop showArrows showStatus={false}>
                  {selectedEvent.multimedia.map((image, index) => (
                    <div key={index}>
                      <img src={image} alt={`Event slide ${index}`} style={{ width: '100%', height: 400, objectFit: 'cover', borderRadius: '8px' }} />
                    </div>
                  ))}
                </Carousel>
              </Box>

              <Box>
                <Typography variant="h3" id="event-modal-title" gutterBottom>
                  {selectedEvent.title}
                </Typography>
                <hr />
                <Typography variant="body1" id="event-modal-description" gutterBottom>
                  {selectedEvent.fullDescription}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default CollapseMenuItemView1;
